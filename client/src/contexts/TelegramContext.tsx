import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import WebApp from "@twa-dev/sdk";

interface TelegramContextType {
  /** Is running inside Telegram Mini App */
  isTelegramMiniApp: boolean;
  /** Telegram WebApp instance */
  webApp: typeof WebApp | null;
  /** Telegram user info */
  telegramUser: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  } | null;
}

const TelegramContext = createContext<TelegramContextType>({
  isTelegramMiniApp: false,
  webApp: null,
  telegramUser: null,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState(false);
  const [webApp, setWebApp] = useState<typeof WebApp | null>(null);
  const [telegramUser, setTelegramUser] = useState<TelegramContextType["telegramUser"]>(null);

  useEffect(() => {
    // Check if running inside Telegram Mini App
    const isTelegram = typeof window !== "undefined" && window.Telegram?.WebApp;

    if (isTelegram) {
      setIsTelegramMiniApp(true);
      setWebApp(WebApp);

      // Initialize Telegram WebApp
      WebApp.ready();
      WebApp.expand();

      // Get Telegram user info
      const user = WebApp.initDataUnsafe?.user;
      if (user) {
        setTelegramUser(user);
      }

      console.log("[TelegramMiniApp] Initialized", {
        user,
        platform: WebApp.platform,
        version: WebApp.version,
      });
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ isTelegramMiniApp, webApp, telegramUser }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
