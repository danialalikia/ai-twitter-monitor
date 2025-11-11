import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Play, Pencil, Trash2, Clock, TrendingUp, History } from "lucide-react";
import { toast } from "sonner";
import { ScheduledPostDialog } from "@/components/ScheduledPostDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TweetCard from "@/components/TweetCard";
import moment from "moment-timezone";
import "moment-jalaali";

export default function ScheduledPosts() {
  const { user, loading: authLoading } = useAuth();
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("schedules");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const { data: schedules, isLoading, refetch } = trpc.scheduled.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  const { data: sentTweets, isLoading: sentTweetsLoading } = trpc.scheduled.sentTweets.useQuery(
    { scheduleId: undefined }, // Show all sent tweets
    { enabled: !!user && activeTab === "history" }
  );
  
  const toggleMutation = trpc.scheduled.toggle.useMutation({
    onSuccess: () => {
      toast.success("وضعیت زمانبندی تغییر کرد");
      refetch();
    },
    onError: (error) => {
      toast.error(`خطا: ${error.message}`);
    },
  });
  
  const deleteMutation = trpc.scheduled.delete.useMutation({
    onSuccess: () => {
      toast.success("زمانبندی حذف شد");
      refetch();
    },
    onError: (error) => {
      toast.error(`خطا: ${error.message}`);
    },
  });
  
  const executeNowMutation = trpc.scheduled.executeNow.useMutation({
    onSuccess: (data, variables) => {
      console.log(`[Frontend] executeNow success:`, data);
      toast.success(
        data.message || `${data.sentCount} توییت ارسال شد`,
        { id: `execute-${variables.id}` }
      );
      refetch();
    },
    onError: (error, variables) => {
      console.error(`[Frontend] executeNow error:`, error);
      toast.error(`خطا: ${error.message}`, { id: `execute-${variables.id}` });
    },
  });

  const deleteGroupMutation = trpc.scheduled.deleteSentGroup.useMutation({
    onSuccess: () => {
      toast.success("گروه حذف شد");
      // Refetch sent tweets to update history
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`خطا: ${error.message}`);
    },
  });
  
  if (authLoading || isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>لطفاً وارد شوید</CardTitle>
            <CardDescription>برای دسترسی به این بخش باید وارد حساب کاربری خود شوید.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  const handleEdit = (schedule: any) => {
    setSelectedSchedule(schedule);
    setDialogOpen(true);
  };
  
  const handleCreate = () => {
    setSelectedSchedule(null);
    setDialogOpen(true);
  };
  
  const handleDelete = (id: number) => {
    if (confirm("آیا مطمئن هستید؟")) {
      deleteMutation.mutate({ id });
    }
  };
  
  const handleToggle = (id: number, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive: !isActive });
  };
  
  const handleExecuteNow = (id: number) => {
    console.log(`[Frontend] handleExecuteNow called with id: ${id}`);
    if (confirm("آیا می‌خواهید این زمانبندی را الان اجرا کنید؟")) {
      console.log(`[Frontend] Calling executeNowMutation.mutate...`);
      toast.loading("در حال ارسال توییت‌ها...", { id: `execute-${id}` });
      executeNowMutation.mutate({ id });
    }
  };
  
  const formatJalaliDate = (date: Date | null) => {
    if (!date) return "—";
    return moment(date).format("jYYYY/jMM/jDD HH:mm");
  };
  
  const getScheduleTypeLabel = (type: string) => {
    switch (type) {
      case "daily": return "روزانه";
      case "weekly": return "هفتگی";
      case "custom": return "سفارشی";
      default: return type;
    }
  };
  
  const getSortByLabel = (sortBy: string) => {
    switch (sortBy) {
      case "trending": return "محبوب‌ترین";
      case "likes": return "بیشترین لایک";
      case "retweets": return "بیشترین ریتوییت";
      case "views": return "بیشترین بازدید";
      case "latest": return "جدیدترین";
      default: return sortBy;
    }
  };
  
  const getNextRunTime = (schedule: any) => {
    if (!schedule.scheduleTimes || !Array.isArray(schedule.scheduleTimes) || schedule.scheduleTimes.length === 0) {
      return null;
    }
    
    const timezone = schedule.timezone || 'Asia/Tehran';
    const now = moment().tz(timezone);
    const times = schedule.scheduleTimes.map((time: string) => {
      const [hour, minute] = time.split(':').map(Number);
      const scheduleTime = now.clone().hour(hour).minute(minute).second(0);
      if (scheduleTime.isBefore(now)) {
        scheduleTime.add(1, 'day');
      }
      return scheduleTime;
    });
    
    times.sort((a: moment.Moment, b: moment.Moment) => a.valueOf() - b.valueOf());
    return times[0];
  };
  
  const getCountdown = (schedule: any) => {
    const nextRun = getNextRunTime(schedule);
    if (!nextRun) return "—";
    
    const now = moment().tz(schedule.timezone || 'Asia/Tehran');
    const diff = nextRun.diff(now);
    
    if (diff < 0) return "در حال اجرا...";
    
    const duration = moment.duration(diff);
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    
    if (hours > 0) {
      return `${hours} ساعت و ${minutes} دقیقه`;
    } else if (minutes > 0) {
      return `${minutes} دقیقه و ${seconds} ثانیه`;
    } else {
      return `${seconds} ثانیه`;
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">زمانبندی ارسال خودکار</h1>
          <p className="text-muted-foreground mt-2">
            مدیریت زمانبندی‌های ارسال خودکار به تلگرام
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 ml-2" />
          زمانبندی جدید
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="schedules">زمانبندی‌ها</TabsTrigger>
          <TabsTrigger value="history">تاریخچه ارسال</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedules">
      {schedules && schedules.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>هیچ زمانبندی‌ای وجود ندارد</CardTitle>
            <CardDescription>
              برای شروع، یک زمانبندی جدید ایجاد کنید.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      <div className="grid gap-4">
        {schedules?.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{schedule.name}</CardTitle>
                    <Badge variant={schedule.isActive ? "default" : "secondary"}>
                      {schedule.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getScheduleTypeLabel(schedule.scheduleType)}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {getSortByLabel(schedule.sortBy)}
                      </span>
                      <span>
                        {schedule.postsPerRun} پست در هر اجرا
                      </span>
                    </div>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!schedule.isActive}
                    onCheckedChange={() => handleToggle(schedule.id, !!schedule.isActive)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Schedule Times */}
                <div>
                  <h4 className="text-sm font-medium mb-2">ساعات ارسال (وقت تهران):</h4>
                  <div className="flex flex-wrap gap-2">
                    {schedule.scheduleTimes && Array.isArray(schedule.scheduleTimes) && schedule.scheduleTimes.map((time: string, idx: number) => (
                      <Badge key={idx} variant="outline">{time}</Badge>
                    ))}
                  </div>
                </div>
                
                {/* Content Mix */}
                {schedule.contentMix && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">تنوع محتوا:</h4>
                    <div className="flex gap-4 text-sm">
                      <span>📝 متن: {schedule.contentMix.text}%</span>
                      <span>🖼️ عکس: {schedule.contentMix.images}%</span>
                      <span>🎥 ویدیو: {schedule.contentMix.videos}%</span>
                    </div>
                  </div>
                )}
                
                {/* Filters */}
                {(schedule.keywords || schedule.minLikes || schedule.minRetweets) && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">فیلترها:</h4>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {schedule.keywords && <Badge variant="secondary">🔍 {schedule.keywords}</Badge>}
                      {schedule.minLikes && <Badge variant="secondary">❤️ حداقل {schedule.minLikes} لایک</Badge>}
                      {schedule.minRetweets && <Badge variant="secondary">🔁 حداقل {schedule.minRetweets} ریتوییت</Badge>}
                    </div>
                  </div>
                )}
                
                {/* Stats */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>آخرین اجرا: {formatJalaliDate(schedule.lastRunAt)}</div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      اجرای بعدی: 
                      <span className="font-medium text-primary">{getCountdown(schedule)}</span>
                    </div>
                    <div>تعداد ارسال شده: {schedule.totalSent || 0}</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteNow(schedule.id)}
                      disabled={executeNowMutation.isPending}
                    >
                      <Play className="w-4 h-4 ml-2" />
                      اجرا الان
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Pencil className="w-4 h-4 ml-2" />
                      ویرایش
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        </TabsContent>
        
        <TabsContent value="history">
          {sentTweetsLoading && (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          )}
          
          {sentTweets && sentTweets.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>هیچ توییتی ارسال نشده</CardTitle>
                <CardDescription>
                  توییت‌های ارسال شده از طریق زمانبندی‌ها اینجا نمایش داده می‌شوند.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          
          <div className="space-y-6">
            {(() => {
              // Group tweets by executionId
              const grouped = sentTweets?.reduce((acc, tweet) => {
                const key = tweet.executionId || 'unknown';
                if (!acc[key]) acc[key] = [];
                acc[key].push(tweet);
                return acc;
              }, {} as Record<string, typeof sentTweets>);
              
              return Object.entries(grouped || {}).map(([executionId, tweets]) => {
                const firstTweet = tweets[0];
                const sentTime = moment(firstTweet.sentAt).locale('fa').format('jYYYY/jMM/jDD HH:mm');
                
                return (
                  <Card key={executionId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => {
                          const el = document.getElementById(`exec-${executionId}`);
                          if (el) el.classList.toggle('hidden');
                        }}>
                          <CardTitle className="text-lg">
                            {sentTime} - {tweets.length} پست ارسال شد
                          </CardTitle>
                          <CardDescription>
                            کلیک کنید برای مشاهده جزئیات
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{tweets.length}</Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`آیا مطمئن هستید که می‌خواهید ${tweets.length} پست این گروه را حذف کنید؟`)) {
                                deleteGroupMutation.mutate({ executionId });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent id={`exec-${executionId}`} className="hidden space-y-4">
                      {tweets.map((tweet) => (
                        <TweetCard
                          key={tweet.id}
                          tweet={{
                            id: tweet.id,
                            tweetId: tweet.tweetId,
                            url: tweet.url,
                            text: tweet.text,
                            createdAt: tweet.createdAt,
                            authorHandle: tweet.authorHandle,
                            authorName: tweet.authorName || tweet.authorHandle,
                            authorVerified: tweet.authorVerified,
                            likeCount: tweet.likeCount,
                            retweetCount: tweet.retweetCount,
                            replyCount: tweet.replyCount,
                            viewCount: Number(tweet.viewCount || 0),
                            mediaUrls: tweet.mediaUrls as any,
                            authorProfileUrl: null,
                            authorProfileImageUrl: null,
                            authorCoverPhoto: null,
                            authorFollowersCount: 0,
                            authorFollowingCount: 0,
                            authorDescription: null,
                            authorJobTitle: null,
                            authorLocation: null,
                            authorWebsite: null,
                            authorJoinDate: null,
                            authorTweetsCount: 0,
                            mediaType: null,
                            trendScore: 0,
                            categories: null,
                          }}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </div>
        </TabsContent>
      </Tabs>
      
      <ScheduledPostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schedule={selectedSchedule}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
