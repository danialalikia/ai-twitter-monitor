import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScheduledPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: any;
  onSuccess: () => void;
}

const defaultTemplate = `🔥 پست ترند روز

{text}

📊 آمار:
❤️ {likes} لایک | 🔁 {retweets} ریتوییت | 👁 {views} بازدید

🔗 {url}`;

export function ScheduledPostDialog({ open, onOpenChange, schedule, onSuccess }: ScheduledPostDialogProps) {
  const [name, setName] = useState("");
  const [scheduleType, setScheduleType] = useState<"daily" | "weekly" | "custom">("daily");
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(["08:00"]);
  const [newTime, setNewTime] = useState("12:00");
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [postsPerRun, setPostsPerRun] = useState(5);
  const [sortBy, setSortBy] = useState<"trending" | "likes" | "retweets" | "views" | "latest">("trending");
  
  // Content Mix
  const [textPercent, setTextPercent] = useState(50);
  const [imagesPercent, setImagesPercent] = useState(30);
  const [videosPercent, setVideosPercent] = useState(20);
  
  // Filters
  const [keywords, setKeywords] = useState("");
  const [queryType, setQueryType] = useState("Latest");
  const [minLikes, setMinLikes] = useState<number | undefined>();
  const [minRetweets, setMinRetweets] = useState<number | undefined>();
  const [minViews, setMinViews] = useState<number | undefined>();
  const [hasImages, setHasImages] = useState(false);
  const [hasVideos, setHasVideos] = useState(false);
  const [hasLinks, setHasLinks] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  
  // Telegram settings
  const [useAiTranslation, setUseAiTranslation] = useState(false);
  const [telegramTemplate, setTelegramTemplate] = useState(defaultTemplate);
  
  // Duplicate prevention
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [duplicateTimeWindow, setDuplicateTimeWindow] = useState(24);
  
  const createMutation = trpc.scheduled.create.useMutation({
    onSuccess: () => {
      toast.success("زمانبندی ایجاد شد");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`خطا: ${error.message}`);
    },
  });
  
  const updateMutation = trpc.scheduled.update.useMutation({
    onSuccess: () => {
      toast.success("زمانبندی به‌روزرسانی شد");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`خطا: ${error.message}`);
    },
  });
  
  useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setScheduleType(schedule.scheduleType);
      setScheduleTimes(schedule.scheduleTimes || []);
      setWeekDays(schedule.weekDays || []);
      setPostsPerRun(schedule.postsPerRun);
      setSortBy(schedule.sortBy);
      
      if (schedule.contentMix) {
        setTextPercent(schedule.contentMix.text);
        setImagesPercent(schedule.contentMix.images);
        setVideosPercent(schedule.contentMix.videos);
      }
      
      setKeywords(schedule.keywords || "");
      setQueryType(schedule.queryType || "Latest");
      setMinLikes(schedule.minLikes);
      setMinRetweets(schedule.minRetweets);
      setMinViews(schedule.minViews);
      setHasImages(!!schedule.hasImages);
      setHasVideos(!!schedule.hasVideos);
      setHasLinks(!!schedule.hasLinks);
      setVerifiedOnly(!!schedule.verifiedOnly);
      setUseAiTranslation(!!schedule.useAiTranslation);
      setTelegramTemplate(schedule.telegramTemplate || defaultTemplate);
      setPreventDuplicates(!!schedule.preventDuplicates);
      setDuplicateTimeWindow(schedule.duplicateTimeWindow || 24);
    } else {
      // Reset to defaults
      setName("");
      setScheduleType("daily");
      setScheduleTimes(["08:00"]);
      setWeekDays([1, 2, 3, 4, 5]);
      setPostsPerRun(5);
      setSortBy("trending");
      setTextPercent(50);
      setImagesPercent(30);
      setVideosPercent(20);
      setKeywords("");
      setQueryType("Latest");
      setMinLikes(undefined);
      setMinRetweets(undefined);
      setMinViews(undefined);
      setHasImages(false);
      setHasVideos(false);
      setHasLinks(false);
      setVerifiedOnly(false);
      setUseAiTranslation(false);
      setTelegramTemplate(defaultTemplate);
      setPreventDuplicates(true);
      setDuplicateTimeWindow(24);
    }
  }, [schedule, open]);
  
  const addTime = () => {
    if (newTime && !scheduleTimes.includes(newTime)) {
      setScheduleTimes([...scheduleTimes, newTime]);
    }
  };
  
  const removeTime = (time: string) => {
    console.log('[removeTime] Before:', scheduleTimes, 'Removing:', time);
    const newTimes = scheduleTimes.filter(t => t !== time);
    console.log('[removeTime] After:', newTimes);
    setScheduleTimes(newTimes);
  };
  
  const toggleWeekDay = (day: number) => {
    if (weekDays.includes(day)) {
      setWeekDays(weekDays.filter(d => d !== day));
    } else {
      setWeekDays([...weekDays, day].sort());
    }
  };
  
  const insertPlaceholder = (placeholder: string) => {
    setTelegramTemplate(telegramTemplate + `{${placeholder}}`);
  };
  
  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("لطفاً نام زمانبندی را وارد کنید");
      return;
    }
    
    if (scheduleTimes.length === 0) {
      toast.error("لطفاً حداقل یک ساعت ارسال انتخاب کنید");
      return;
    }
    
    const totalPercent = textPercent + imagesPercent + videosPercent;
    if (totalPercent !== 100) {
      toast.error("مجموع درصدهای تنوع محتوا باید 100 باشد");
      return;
    }
    
    const data = {
      name,
      scheduleType,
      scheduleTimes,
      weekDays: scheduleType === "weekly" ? weekDays : undefined,
      postsPerRun,
      sortBy,
      contentMix: {
        text: textPercent,
        images: imagesPercent,
        videos: videosPercent,
      },
      preventDuplicates,
      duplicateTimeWindow,
      keywords: keywords.trim() || undefined,
      queryType,
      minLikes,
      minRetweets,
      minViews,
      hasImages,
      hasVideos,
      hasLinks,
      verifiedOnly,
      useAiTranslation,
      telegramTemplate: telegramTemplate.trim() || undefined,
    };
    
    if (schedule) {
      updateMutation.mutate({ id: schedule.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };
  
  const weekDayNames = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{schedule ? "ویرایش زمانبندی" : "زمانبندی جدید"}</DialogTitle>
          <DialogDescription>
            تنظیمات ارسال خودکار به تلگرام را مشخص کنید
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">پایه</TabsTrigger>
            <TabsTrigger value="filters">فیلترها</TabsTrigger>
            <TabsTrigger value="content">محتوا</TabsTrigger>
            <TabsTrigger value="telegram">تلگرام</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="name">نام زمانبندی</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: ارسال صبحگاهی"
              />
            </div>
            
            <div>
              <Label htmlFor="scheduleType">نوع زمانبندی</Label>
              <Select value={scheduleType} onValueChange={(v: any) => setScheduleType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">روزانه</SelectItem>
                  <SelectItem value="weekly">هفتگی</SelectItem>
                  <SelectItem value="custom">سفارشی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {scheduleType === "weekly" && (
              <div>
                <Label>روزهای هفته</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {weekDayNames.map((day, idx) => (
                    <Badge
                      key={idx}
                      variant={weekDays.includes(idx) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleWeekDay(idx)}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <Label>ساعات ارسال (وقت تهران)</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {scheduleTimes.map(time => (
                  <Badge key={time} variant="secondary" className="flex items-center gap-1">
                    <span>{time}</span>
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[Button Click] Removing:', time);
                        removeTime(time);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-32"
                />
                <Button type="button" onClick={addTime} variant="outline" size="sm">
                  <Plus className="w-4 h-4 ml-2" />
                  افزودن
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postsPerRun">تعداد پست در هر اجرا</Label>
                <Input
                  id="postsPerRun"
                  type="number"
                  min="1"
                  max="50"
                  value={postsPerRun}
                  onChange={(e) => setPostsPerRun(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div>
                <Label htmlFor="sortBy">مرتب‌سازی بر اساس</Label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">محبوب‌ترین</SelectItem>
                    <SelectItem value="likes">بیشترین لایک</SelectItem>
                    <SelectItem value="retweets">بیشترین ریتوییت</SelectItem>
                    <SelectItem value="views">بیشترین بازدید</SelectItem>
                    <SelectItem value="latest">جدیدترین</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="filters" className="space-y-4">
            <div>
              <Label htmlFor="keywords">کلمات کلیدی (با کاما جدا کنید)</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="AI, Machine Learning, Technology"
              />
            </div>
            
            <div>
              <Label htmlFor="queryType">نوع جستجو</Label>
              <Select value={queryType} onValueChange={setQueryType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Latest">جدیدترین</SelectItem>
                  <SelectItem value="Top">محبوب‌ترین</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minLikes">حداقل لایک</Label>
                <Input
                  id="minLikes"
                  type="number"
                  min="0"
                  value={minLikes || ""}
                  onChange={(e) => setMinLikes(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="minRetweets">حداقل ریتوییت</Label>
                <Input
                  id="minRetweets"
                  type="number"
                  min="0"
                  value={minRetweets || ""}
                  onChange={(e) => setMinRetweets(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="minViews">حداقل بازدید</Label>
                <Input
                  id="minViews"
                  type="number"
                  min="0"
                  value={minViews || ""}
                  onChange={(e) => setMinViews(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="hasImages">فقط با عکس</Label>
                <Switch id="hasImages" checked={hasImages} onCheckedChange={setHasImages} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hasVideos">فقط با ویدیو</Label>
                <Switch id="hasVideos" checked={hasVideos} onCheckedChange={setHasVideos} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hasLinks">فقط با لینک</Label>
                <Switch id="hasLinks" checked={hasLinks} onCheckedChange={setHasLinks} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="verifiedOnly">فقط اکانت‌های تأیید شده</Label>
                <Switch id="verifiedOnly" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <div>
              <Label>تنوع محتوا (مجموع باید 100 باشد)</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="textPercent" className="text-sm">📝 متن (%)</Label>
                  <Input
                    id="textPercent"
                    type="number"
                    min="0"
                    max="100"
                    value={textPercent}
                    onChange={(e) => setTextPercent(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="imagesPercent" className="text-sm">🖼️ عکس (%)</Label>
                  <Input
                    id="imagesPercent"
                    type="number"
                    min="0"
                    max="100"
                    value={imagesPercent}
                    onChange={(e) => setImagesPercent(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="videosPercent" className="text-sm">🎥 ویدیو (%)</Label>
                  <Input
                    id="videosPercent"
                    type="number"
                    min="0"
                    max="100"
                    value={videosPercent}
                    onChange={(e) => setVideosPercent(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                مجموع: {textPercent + imagesPercent + videosPercent}%
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="preventDuplicates">جلوگیری از ارسال تکراری</Label>
                  <p className="text-sm text-muted-foreground">
                    پست‌های تکراری در بازه زمانی مشخص ارسال نمی‌شوند
                  </p>
                </div>
                <Switch id="preventDuplicates" checked={preventDuplicates} onCheckedChange={setPreventDuplicates} />
              </div>
              
              {preventDuplicates && (
                <div>
                  <Label htmlFor="duplicateTimeWindow">بازه زمانی (ساعت)</Label>
                  <Input
                    id="duplicateTimeWindow"
                    type="number"
                    min="1"
                    max="168"
                    value={duplicateTimeWindow}
                    onChange={(e) => setDuplicateTimeWindow(parseInt(e.target.value) || 24)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    پست‌های تکراری در {duplicateTimeWindow} ساعت گذشته ارسال نمی‌شوند
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="telegram" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="useAiTranslation">ترجمه خودکار با AI</Label>
                <p className="text-sm text-muted-foreground">
                  متن توییت‌ها قبل از ارسال ترجمه می‌شود
                </p>
              </div>
              <Switch id="useAiTranslation" checked={useAiTranslation} onCheckedChange={setUseAiTranslation} />
            </div>
            
            <div>
              <Label htmlFor="telegramTemplate">قالب پیام تلگرام</Label>
              <Textarea
                id="telegramTemplate"
                value={telegramTemplate}
                onChange={(e) => setTelegramTemplate(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder("text")}>
                  {"{text}"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder("author")}>
                  {"{author}"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder("likes")}>
                  {"{likes}"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder("retweets")}>
                  {"{retweets}"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder("views")}>
                  {"{views}"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder("url")}>
                  {"{url}"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder("date")}>
                  {"{date}"}
                </Button>
                {useAiTranslation && (
                  <Button type="button" variant="outline" size="sm" onClick={() => insertPlaceholder("translated")}>
                    {"{translated}"}
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                از placeholders بالا برای قالب‌بندی پیام استفاده کنید
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {schedule ? "به‌روزرسانی" : "ایجاد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
