import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Bookmarks from "./pages/Bookmarks";
import ScheduledPosts from "./pages/ScheduledPosts";
import TelegramLogin from "./pages/TelegramLogin";
import DebugInfo from "./pages/DebugInfo";
import { useTelegram } from "./contexts/TelegramContext";
import { useAuth } from "./_core/hooks/useAuth";

function Router() {
  const { isTelegramMiniApp } = useTelegram();
  const { user, loading } = useAuth();

  // Telegram Mini App: require Google login
  if (isTelegramMiniApp && !loading && !user) {
    return <TelegramLogin />;
  }

  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/bookmarks"} component={Bookmarks} />
      <Route path={"/scheduled"} component={ScheduledPosts} />
      <Route path={"/telegram-login"} component={TelegramLogin} />
      <Route path={"/debug"} component={DebugInfo} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
