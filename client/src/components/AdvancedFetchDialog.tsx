import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FetchSetting {
  id: number;
  name: string;
  queryType?: string | null;
  maxItems?: number | null;
  lang?: string | null;
  minFaves?: number | null;
  minRetweets?: number | null;
  minReplies?: number | null;
  filterImages?: number | null;
  filterVideos?: number | null;
  filterLinks?: number | null;
  filterVerified?: number | null;
  filterSafe?: number | null;
  since?: string | null;
  until?: string | null;
  withinTime?: string | null;
  fromUser?: string | null;
  toUser?: string | null;
  mentionUser?: string | null;
}

interface AdvancedFetchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFetch: (params: FetchParams) => void;
  isLoading: boolean;
}

export interface FetchParams {
  // Search
  queryType?: string;
  maxItems?: number;
  lang?: string;
  
  // Engagement
  minLikes?: number;
  minRetweets?: number;
  minReplies?: number;
  
  // Content filters
  hasImages: boolean;
  hasVideos: boolean;
  hasLinks: boolean;
  verifiedOnly: boolean;
  safeOnly: boolean;
  
  // Time filters
  since?: string;
  until?: string;
  withinTime?: string;
  
  // User filters
  fromUser?: string;
  toUser?: string;
  mentionUser?: string;
}

export function AdvancedFetchDialog({ open, onOpenChange, onFetch, isLoading }: AdvancedFetchDialogProps) {
  // Preset management
  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  
  // Search params
  const [queryType, setQueryType] = useState("Latest");
  const [maxItems, setMaxItems] = useState("200");
  const [lang, setLang] = useState("en");
  
  // Engagement params
  const [minLikes, setMinLikes] = useState("");
  const [minRetweets, setMinRetweets] = useState("");
  const [minReplies, setMinReplies] = useState("");
  
  // Content filters
  const [hasImages, setHasImages] = useState(false);
  const [hasVideos, setHasVideos] = useState(false);
  const [hasLinks, setHasLinks] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [safeOnly, setSafeOnly] = useState(false);
  
  // Time filters
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [withinTime, setWithinTime] = useState("");
  
  // User filters
  const [fromUser, setFromUser] = useState("");
  const [toUser, setToUser] = useState("");
  const [mentionUser, setMentionUser] = useState("");

  // Fetch presets
  const { data: presets, refetch: refetchPresets } = trpc.fetchSettings.list.useQuery();
  const savePresetMutation = trpc.fetchSettings.save.useMutation({
    onSuccess: () => {
      toast.success("پیش‌فرض ذخیره شد");
      refetchPresets();
    },
    onError: (error: any) => {
      toast.error(`خطا در ذخیره: ${error.message}`);
    },
  });
  const deletePresetMutation = trpc.fetchSettings.delete.useMutation({
    onSuccess: () => {
      toast.success("پیش‌فرض حذف شد");
      refetchPresets();
      setSelectedPresetId(null);
    },
  });

  // Load preset when selected
  useEffect(() => {
    if (selectedPresetId && presets) {
      const preset = presets.find((p: FetchSetting) => p.id === selectedPresetId);
      if (preset) {
        setQueryType(preset.queryType || "Latest");
        setMaxItems(String(preset.maxItems || 200));
        setLang(preset.lang || "en");
        setMinLikes(preset.minFaves ? String(preset.minFaves) : "");
        setMinRetweets(preset.minRetweets ? String(preset.minRetweets) : "");
        setMinReplies(preset.minReplies ? String(preset.minReplies) : "");
        setHasImages(!!preset.filterImages);
        setHasVideos(!!preset.filterVideos);
        setHasLinks(!!preset.filterLinks);
        setVerifiedOnly(!!preset.filterVerified);
        setSafeOnly(!!preset.filterSafe);
        setSince(preset.since || "");
        setUntil(preset.until || "");
        setWithinTime(preset.withinTime || "");
        setFromUser(preset.fromUser || "");
        setToUser(preset.toUser || "");
        setMentionUser(preset.mentionUser || "");
        setPresetName(preset.name);
      }
    }
  }, [selectedPresetId, presets]);

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error("لطفاً نام پیش‌فرض را وارد کنید");
      return;
    }

    savePresetMutation.mutate({
      id: selectedPresetId || undefined,
      name: presetName,
      queryType,
      maxItems: parseInt(maxItems) || 200,
      lang,
      minFaves: minLikes ? parseInt(minLikes) : 0,
      minRetweets: minRetweets ? parseInt(minRetweets) : 0,
      minReplies: minReplies ? parseInt(minReplies) : 0,
      filterImages: hasImages ? 1 : 0,
      filterVideos: hasVideos ? 1 : 0,
      filterLinks: hasLinks ? 1 : 0,
      filterVerified: verifiedOnly ? 1 : 0,
      filterSafe: safeOnly ? 1 : 0,
      since: since || null,
      until: until || null,
      withinTime: withinTime || null,
      fromUser: fromUser || null,
      toUser: toUser || null,
      mentionUser: mentionUser || null,
    });
  };

  const handleFetch = () => {
    const params: FetchParams = {
      queryType,
      maxItems: parseInt(maxItems) || 200,
      lang,
      minLikes: minLikes ? parseInt(minLikes) : undefined,
      minRetweets: minRetweets ? parseInt(minRetweets) : undefined,
      minReplies: minReplies ? parseInt(minReplies) : undefined,
      hasImages,
      hasVideos,
      hasLinks,
      verifiedOnly,
      safeOnly,
      since: since || undefined,
      until: until || undefined,
      withinTime: withinTime || undefined,
      fromUser: fromUser || undefined,
      toUser: toUser || undefined,
      mentionUser: mentionUser || undefined,
    };
    onFetch(params);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>پارامترهای پیشرفته جستجو</DialogTitle>
          <DialogDescription>
            فیلترهای دلخواه خود را برای دریافت توییت‌های مرتبط‌تر تنظیم کنید
          </DialogDescription>
        </DialogHeader>

        {/* Preset Management */}
        <div className="space-y-3 pb-4 border-b">
          <Label>پیش‌فرض‌های ذخیره شده</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedPresetId?.toString() || ""} 
              onValueChange={(v) => setSelectedPresetId(v ? parseInt(v) : null)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="انتخاب پیش‌فرض..." />
              </SelectTrigger>
              <SelectContent>
                {presets?.map((preset: FetchSetting) => (
                  <SelectItem key={preset.id} value={preset.id.toString()}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPresetId && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => deletePresetMutation.mutate({ id: selectedPresetId })}
                disabled={deletePresetMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="نام پیش‌فرض جدید..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={handleSavePreset}
              disabled={savePresetMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              ذخیره
            </Button>
          </div>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search">جستجو</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="content">محتوا</TabsTrigger>
            <TabsTrigger value="advanced">پیشرفته</TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="queryType">نوع جستجو</Label>
                <Select value={queryType} onValueChange={setQueryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Latest">جدیدترین (Latest)</SelectItem>
                    <SelectItem value="Top">محبوب‌ترین (Top)</SelectItem>
                    <SelectItem value="Photos">عکس‌ها (Photos)</SelectItem>
                    <SelectItem value="Videos">ویدیوها (Videos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxItems">حداکثر تعداد</Label>
                <Input
                  id="maxItems"
                  type="number"
                  value={maxItems}
                  onChange={(e) => setMaxItems(e.target.value)}
                  min="1"
                  max="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lang">زبان</Label>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fa">فارسی</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minLikes">حداقل لایک</Label>
                <Input
                  id="minLikes"
                  type="number"
                  placeholder="0"
                  value={minLikes}
                  onChange={(e) => setMinLikes(e.target.value)}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRetweets">حداقل ریتوییت</Label>
                <Input
                  id="minRetweets"
                  type="number"
                  placeholder="0"
                  value={minRetweets}
                  onChange={(e) => setMinRetweets(e.target.value)}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minReplies">حداقل ریپلای</Label>
                <Input
                  id="minReplies"
                  type="number"
                  placeholder="0"
                  value={minReplies}
                  onChange={(e) => setMinReplies(e.target.value)}
                  min="0"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 نکته: مقادیر کمتر (مثلاً 5-10) نتایج بیشتری برمی‌گردونه
            </p>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="hasImages"
                  checked={hasImages}
                  onCheckedChange={(checked) => setHasImages(checked as boolean)}
                />
                <Label htmlFor="hasImages" className="text-sm cursor-pointer">
                  فقط توییت‌های دارای تصویر
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="hasVideos"
                  checked={hasVideos}
                  onCheckedChange={(checked) => setHasVideos(checked as boolean)}
                />
                <Label htmlFor="hasVideos" className="text-sm cursor-pointer">
                  فقط توییت‌های دارای ویدیو
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="hasLinks"
                  checked={hasLinks}
                  onCheckedChange={(checked) => setHasLinks(checked as boolean)}
                />
                <Label htmlFor="hasLinks" className="text-sm cursor-pointer">
                  فقط توییت‌های دارای لینک
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="verifiedOnly"
                  checked={verifiedOnly}
                  onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
                />
                <Label htmlFor="verifiedOnly" className="text-sm cursor-pointer">
                  فقط از کاربران تایید شده (Verified)
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="safeOnly"
                  checked={safeOnly}
                  onCheckedChange={(checked) => setSafeOnly(checked as boolean)}
                />
                <Label htmlFor="safeOnly" className="text-sm cursor-pointer">
                  حذف محتوای حساس (Safe Mode)
                </Label>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">فیلتر زمانی</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="since" className="text-xs">از تاریخ (Since)</Label>
                  <Input
                    id="since"
                    type="datetime-local"
                    value={since}
                    onChange={(e) => setSince(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="until" className="text-xs">تا تاریخ (Until)</Label>
                  <Input
                    id="until"
                    type="datetime-local"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="withinTime" className="text-xs">در بازه زمانی (مثال: 1h, 1d, 7d)</Label>
                <Input
                  id="withinTime"
                  placeholder="1d"
                  value={withinTime}
                  onChange={(e) => setWithinTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <h4 className="text-sm font-medium">فیلتر کاربری</h4>
              <div className="space-y-2">
                <Label htmlFor="fromUser" className="text-xs">از کاربر (@username)</Label>
                <Input
                  id="fromUser"
                  placeholder="elonmusk"
                  value={fromUser}
                  onChange={(e) => setFromUser(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toUser" className="text-xs">به کاربر (@username)</Label>
                <Input
                  id="toUser"
                  placeholder="NASA"
                  value={toUser}
                  onChange={(e) => setToUser(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentionUser" className="text-xs">منشن کاربر (@username)</Label>
                <Input
                  id="mentionUser"
                  placeholder="openai"
                  value={mentionUser}
                  onChange={(e) => setMentionUser(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            انصراف
          </Button>
          <Button onClick={handleFetch} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                در حال دریافت...
              </>
            ) : (
              "شروع جستجو"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
