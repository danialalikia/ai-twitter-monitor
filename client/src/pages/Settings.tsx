import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();

  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery(undefined, {
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    apifyToken: "",
    telegramBotToken: "",
    telegramChatId: "",
    keywords: "AI,artificial intelligence,machine learning,deep learning,LLM,GPT",
    scheduleTime: "08:00",
    timezone: "UTC",
    maxItemsPerRun: "200",
    aiRewriteEnabled: false,
    aiRewritePrompt: "",
    telegramTemplate: "",
    includeStats: true,
    includeLink: true,
    includeAuthor: true,
    includeMedia: true,
    includeDate: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        apifyToken: settings.apifyToken || "",
        telegramBotToken: settings.telegramBotToken || "",
        telegramChatId: settings.telegramChatId || "",
        keywords: settings.keywords,
        scheduleTime: settings.scheduleTime,
        timezone: settings.timezone,
        maxItemsPerRun: String(settings.maxItemsPerRun),
        aiRewriteEnabled: Boolean((settings as any).aiRewriteEnabled),
        aiRewritePrompt: (settings as any).aiRewritePrompt || "",
        telegramTemplate: (settings as any).telegramTemplate || "",
        includeStats: (settings as any).includeStats !== undefined ? Boolean((settings as any).includeStats) : true,
        includeLink: (settings as any).includeLink !== undefined ? Boolean((settings as any).includeLink) : true,
        includeAuthor: (settings as any).includeAuthor !== undefined ? Boolean((settings as any).includeAuthor) : true,
        includeMedia: (settings as any).includeMedia !== undefined ? Boolean((settings as any).includeMedia) : true,
        includeDate: Boolean((settings as any).includeDate),
      });
    }
  }, [settings]);

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      ...formData,
      maxItemsPerRun: parseInt(formData.maxItemsPerRun) || 200,
    });
  };

  if (authLoading || settingsLoading) {
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
            <CardDescription>Please sign in to access settings</CardDescription>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">API Tokens</CardTitle>
              <CardDescription>Configure your API credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apifyToken">Apify Token *</Label>
                <Input
                  id="apifyToken"
                  type="password"
                  placeholder="Enter your Apify API token"
                  value={formData.apifyToken}
                  onChange={(e) => setFormData({ ...formData, apifyToken: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Get your token from{" "}
                  <a
                    href="https://console.apify.com/account/integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Apify Console
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
                <Input
                  id="telegramBotToken"
                  type="password"
                  placeholder="Enter your Telegram bot token"
                  value={formData.telegramBotToken}
                  onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Create a bot with{" "}
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @BotFather
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
                <Input
                  id="telegramChatId"
                  type="text"
                  placeholder="Your Telegram chat ID"
                  value={formData.telegramChatId}
                  onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Get your chat ID from{" "}
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @userinfobot
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fetch Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Fetch Configuration</CardTitle>
              <CardDescription>Configure what and when to fetch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords *</Label>
                <Textarea
                  id="keywords"
                  placeholder="AI,machine learning,deep learning"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  required
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of keywords to search for
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduleTime">Schedule Time</Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    value={formData.scheduleTime}
                    onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Daily fetch time</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    type="text"
                    placeholder="UTC"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Your timezone</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxItemsPerRun">Max Items Per Run</Label>
                <Input
                  id="maxItemsPerRun"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.maxItemsPerRun}
                  onChange={(e) => setFormData({ ...formData, maxItemsPerRun: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of tweets to fetch (1-1000)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI & Telegram Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">AI Tweet Rewriter & Telegram</CardTitle>
              <CardDescription>Configure AI rewriting and custom Telegram message format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="aiRewriteEnabled"
                    className="h-4 w-4"
                    checked={formData.aiRewriteEnabled}
                    onChange={(e) => setFormData({ ...formData, aiRewriteEnabled: e.target.checked })}
                  />
                  <Label htmlFor="aiRewriteEnabled" className="cursor-pointer">
                    Enable AI Tweet Rewriting
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  When enabled, "Send with AI" button will rewrite tweets using your custom prompt
                </p>
              </div>

              {formData.aiRewriteEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="aiRewritePrompt">AI Rewrite Prompt *</Label>
                    <Textarea
                      id="aiRewritePrompt"
                      placeholder="Example: Translate this tweet to Persian and rewrite it in a casual, friendly tone. Add relevant emojis. Keep it under 280 characters."
                      value={formData.aiRewritePrompt}
                      onChange={(e) => setFormData({ ...formData, aiRewritePrompt: e.target.value })}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Instructions for AI on how to rewrite the tweet
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegramTemplate">Telegram Message Template</Label>
                    <Textarea
                      id="telegramTemplate"
                      placeholder={`{{rewritten_text}}\n\n✍️ {{author}} ({{handle}})\n📊 {{likes}} likes · {{retweets}} retweets · {{comments}} comments\n🔗 {{link}}`}
                      value={formData.telegramTemplate}
                      onChange={(e) => setFormData({ ...formData, telegramTemplate: e.target.value })}
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Available placeholders: {'{{'} rewritten_text {'}}'},  {'{{'} original_text {'}}'},  {'{{'} author {'}}'},  {'{{'} handle {'}}'},  {'{{'} likes {'}}'},  {'{{'} retweets {'}}'},  {'{{'} comments {'}}'},  {'{{'} views {'}}'},  {'{{'} link {'}}'},  {'{{'} date {'}}'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Include in Telegram Message</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeStats"
                          className="h-4 w-4"
                          checked={formData.includeStats}
                          onChange={(e) => setFormData({ ...formData, includeStats: e.target.checked })}
                        />
                        <Label htmlFor="includeStats" className="cursor-pointer font-normal">
                          Stats (likes, retweets, comments, views)
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeLink"
                          className="h-4 w-4"
                          checked={formData.includeLink}
                          onChange={(e) => setFormData({ ...formData, includeLink: e.target.checked })}
                        />
                        <Label htmlFor="includeLink" className="cursor-pointer font-normal">
                          Twitter Link
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeAuthor"
                          className="h-4 w-4"
                          checked={formData.includeAuthor}
                          onChange={(e) => setFormData({ ...formData, includeAuthor: e.target.checked })}
                        />
                        <Label htmlFor="includeAuthor" className="cursor-pointer font-normal">
                          Author Name & Handle
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeMedia"
                          className="h-4 w-4"
                          checked={formData.includeMedia}
                          onChange={(e) => setFormData({ ...formData, includeMedia: e.target.checked })}
                        />
                        <Label htmlFor="includeMedia" className="cursor-pointer font-normal">
                          Media (photos & videos)
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeDate"
                          className="h-4 w-4"
                          checked={formData.includeDate}
                          onChange={(e) => setFormData({ ...formData, includeDate: e.target.checked })}
                        />
                        <Label htmlFor="includeDate" className="cursor-pointer font-normal">
                          Tweet Date
                        </Label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
