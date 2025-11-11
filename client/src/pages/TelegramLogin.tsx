import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useTelegram } from "@/contexts/TelegramContext";

/**
 * Login page for Telegram Mini App
 * 
 * Users must login with Manus OAuth to access the app.
 * Only emails in the ownerEmails list can access.
 */
export default function TelegramLogin() {
  const { isTelegramMiniApp, telegramUser } = useTelegram();

  const handleManusLogin = () => {
    // Redirect to Manus OAuth
    window.location.href = getLoginUrl();
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
                برای دسترسی به اپلیکیشن، لطفاً وارد شوید.
              </>
            ) : (
              "لطفاً وارد شوید"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleManusLogin}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.3"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            ورود با Manus
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            فقط ایمیل‌های مجاز می‌توانند به این اپلیکیشن دسترسی داشته باشند.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
