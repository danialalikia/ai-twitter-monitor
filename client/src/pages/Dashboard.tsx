import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Image, BarChart3, RefreshCw, Settings as SettingsIcon, Bookmark } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { AdvancedFetchDialog, FetchParams } from "@/components/AdvancedFetchDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TweetCard from "@/components/TweetCard";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [isFetching, setIsFetching] = useState(false);
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);
  const [sortBy, setSortBy] = useState<string>("trendScore");

  const { data: tweets, isLoading: tweetsLoading, refetch: refetchTweets } = trpc.tweets.latest.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: latestRun } = trpc.runs.latest.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    enabled: !!user,
  });

  const fetchNowMutation = trpc.fetch.now.useMutation({
    onSuccess: (data) => {
      toast.success(`Fetched ${data.totalItems} tweets successfully!`);
      if (data.warning) {
        toast.warning(data.warning);
      }
      refetchTweets();
    },
    onError: (error) => {
      toast.error(`Failed to fetch: ${error.message}`);
    },
    onSettled: () => {
      setIsFetching(false);
    },
  });

  // Ignore functionality removed

  const sendReportMutation = trpc.telegram.sendReport.useMutation({
    onSuccess: () => {
      toast.success("Telegram report sent successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to send report: ${error.message}`);
    },
  });

  const deleteAllMutation = trpc.tweets.deleteAll.useMutation({
    onSuccess: () => {
      toast.success("All tweets cleared successfully!");
      refetchTweets();
    },
    onError: (error) => {
      toast.error(`Failed to clear tweets: ${error.message}`);
    },
  });

  const handleFetchNow = () => {
    if (!settings?.apifyToken) {
      toast.error("Please configure your Apify token in Settings first");
      return;
    }
    setShowAdvancedDialog(true);
  };

  const handleAdvancedFetch = (params: FetchParams) => {
    setIsFetching(true);
    setShowAdvancedDialog(false);
    fetchNowMutation.mutate({ 
      minLikes: params.minLikes,
      minRetweets: params.minRetweets,
      minViews: undefined,
      hasImages: params.hasImages,
      hasVideos: params.hasVideos,
      hasLinks: params.hasLinks,
      verifiedOnly: params.verifiedOnly,
    });
  };

  // Ignore functionality removed

  // Sort and filter tweets
  const sortedTweets = useMemo(() => {
    if (!tweets) return [];
    
    const sorted = [...tweets];
    
    switch (sortBy) {
      case "likes":
        return sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      case "retweets":
        return sorted.sort((a, b) => (b.retweetCount || 0) - (a.retweetCount || 0));
      case "views":
        return sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      case "date":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "trendScore":
      default:
        return sorted.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
    }
  }, [tweets, sortBy]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{APP_TITLE}</CardTitle>
            <CardDescription>Please sign in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const viralCount = tweets?.filter(t => t.categories?.includes("Viral")).length || 0;
  
  // Count tweets with actual media (not just category)
  const mediaRichCount = tweets?.filter(t => {
    if (!t.mediaUrls) return false;
    return Array.isArray(t.mediaUrls) && t.mediaUrls.length > 0;
  }).length || 0;
  
  const totalFetched = tweets?.length || 0;
  const lastRunTime = latestRun?.[0]?.completedAt;
  const isApifyConfigured = !!settings?.apifyToken;
  const isTelegramConfigured = !!settings?.telegramBotToken && !!settings?.telegramChatId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleFetchNow}
              disabled={isFetching || !isApifyConfigured}
              variant="default"
              title={!isApifyConfigured ? "Configure Apify token in Settings first" : ""}
            >
              {isFetching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fetch Now
                </>
              )}
            </Button>
            <Button
              onClick={() => sendReportMutation.mutate({})}
              disabled={sendReportMutation.isPending || !tweets || tweets.length === 0 || !isTelegramConfigured}
              variant="outline"
              title={!isTelegramConfigured ? "Configure Telegram bot in Settings first" : ""}
            >
              {sendReportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Telegram Report"
              )}
            </Button>
            <Button asChild variant="outline">
              <Link href="/bookmarks">
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmarks
              </Link>
            </Button>
            <Button
              onClick={() => {
                if (confirm("Are you sure you want to delete all tweets? This cannot be undone.")) {
                  deleteAllMutation.mutate();
                }
              }}
              disabled={deleteAllMutation.isPending || !tweets || tweets.length === 0}
              variant="outline"
              className="text-red-500 hover:text-red-600"
            >
              {deleteAllMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear All Tweets"
              )}
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8">
        {/* Configuration Warning */}
        {!isApifyConfigured && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-200 text-sm">
              ⚠️ <strong>Configuration Required:</strong> Please configure your Apify token in{" "}
              <Link href="/settings" className="underline hover:text-yellow-100">Settings</Link>{" "}
              to start fetching tweets.
            </p>
          </div>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Viral</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{viralCount}</div>
              <p className="text-xs text-muted-foreground">Trending posts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Media-rich</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mediaRichCount}</div>
              <p className="text-xs text-muted-foreground">Posts with media</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Fetched</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalFetched}</div>
              <p className="text-xs text-muted-foreground">
                {lastRunTime ? `Last run: ${new Date(lastRunTime).toLocaleString()}` : "No runs yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tweet Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Latest Tweets</CardTitle>
                <CardDescription>AI-related trending posts from Twitter/X</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">مرتب‌سازی:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trendScore">امتیاز ترند</SelectItem>
                    <SelectItem value="likes">بیشترین لایک</SelectItem>
                    <SelectItem value="retweets">بیشترین ریتوییت</SelectItem>
                    <SelectItem value="views">بیشترین بازدید</SelectItem>
                    <SelectItem value="date">جدیدترین</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tweetsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !tweets || tweets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No tweets fetched yet. Click "Fetch Now" to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTweets.map((tweet) => (
                  <TweetCard
                    key={tweet.id}
                    tweet={tweet}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Advanced Fetch Dialog */}
      <AdvancedFetchDialog
        open={showAdvancedDialog}
        onOpenChange={setShowAdvancedDialog}
        onFetch={handleAdvancedFetch}
        isLoading={isFetching}
      />
    </div>
  );
}
