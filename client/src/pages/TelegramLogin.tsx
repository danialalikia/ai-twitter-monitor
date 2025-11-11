import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useTelegram } from "@/contexts/TelegramContext";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

/**
 * Login page for Telegram Mini App
 * 
 * Users must login with Google to access the app.
 * Only emails in the ownerEmails list can access.
 */
export default function TelegramLogin() {
  const { isTelegramMiniApp, telegramUser } = useTelegram();

  useEffect(() => {
    // Auto-redirect to Google OAuth if not logged in
    // This will be handled by the main App component
  }, []);

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    const returnUrl = window.location.pathname;
    window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {APP_LOGO && (
            <div className="flex justify-center mb-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16 rounded-lg" />
            </div>
          )}
          <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
          <CardDescription>
            {isTelegramMiniApp && telegramUser ? (
              <>
                سلام {telegramUser.first_name}! 👋
                <br />
                برای دسترسی به اپلیکیشن، لطفاً با Gmail خود وارد شوید.
              </>
            ) : (
              "لطفاً با Gmail خود وارد شوید"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            className="w-full"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            ورود با Google
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            فقط ایمیل‌های مجاز می‌توانند به این اپلیکیشن دسترسی داشته باشند.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
