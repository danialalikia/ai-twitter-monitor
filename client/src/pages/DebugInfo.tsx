import { useAuth } from "@/_core/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DebugInfo() {
  const { user } = useAuth();
  const { isTelegramMiniApp, webApp } = useTelegram();
  const [copied, setCopied] = useState<string | null>(null);

  const currentUrl = window.location.href;
  const origin = window.location.origin;
  const redirectUri = `${origin}/auth/google/callback`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const debugInfo = {
    "Current URL": currentUrl,
    "Origin": origin,
    "Redirect URI": redirectUri,
    "Is Telegram Mini App": isTelegramMiniApp ? "Yes" : "No",
    "User Agent": navigator.userAgent,
    "Telegram Init Data": webApp?.initData || "N/A",
    "User Logged In": user ? "Yes" : "No",
    "User Email": user?.email || "N/A",
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">🔍 Debug Information</CardTitle>
            <CardDescription>
              اطلاعات مهم برای تنظیم Google OAuth Redirect URIs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(debugInfo).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{key}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(value, key)}
                    className="h-8 px-2"
                  >
                    {copied === key ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground break-all bg-muted p-2 rounded">
                  {value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="text-foreground">📋 دستورالعمل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-foreground">1. کپی کردن Redirect URI:</p>
              <p className="text-muted-foreground">
                روی دکمه کپی کنار "Redirect URI" کلیک کن
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground">2. اضافه کردن به Google Console:</p>
              <p className="text-muted-foreground">
                برو به Google Cloud Console → OAuth client → Authorized redirect URIs → Add URI
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground">3. Redirect URI که باید اضافه کنی:</p>
              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded border border-orange-200 dark:border-orange-800">
                <code className="text-orange-600 dark:text-orange-400 break-all">
                  {redirectUri}
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-foreground">4. ذخیره و صبر:</p>
              <p className="text-muted-foreground">
                بعد از Save کردن، 5-10 دقیقه صبر کن تا تغییرات اعمال بشه
              </p>
            </div>
          </CardContent>
        </Card>

        {!user && (
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="text-foreground">🔐 Login Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  window.location.href = "/auth/google";
                }}
                className="w-full"
              >
                Test Google Login
              </Button>
            </CardContent>
          </Card>
        )}

        {user && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-foreground text-green-600">✅ Login Successful!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                شما با موفقیت لاگین شدید. حالا می‌تونی به Dashboard برگردی.
              </p>
              <Button
                onClick={() => {
                  window.location.href = "/";
                }}
                className="w-full mt-4"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
