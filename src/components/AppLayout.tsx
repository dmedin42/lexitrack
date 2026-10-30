import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, FileText, Settings, PlusCircle, LogOut, BookOpen, Crown, EllipsisVertical, ExternalLink, Loader2 } from "lucide-react";
import lexitrackLogo from "@/assets/lexitrack-logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", path: "/", icon: BookOpen },
  { label: "Clusters", path: "/clusters", icon: BarChart3 },
  { label: "Assessments", path: "/assessments", icon: PlusCircle },
  { label: "Parent Report", path: "/parent-report", icon: FileText },
  { label: "Manage Class", path: "/manage-class", icon: Settings },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const { isPro } = useSubscription();
  const [loadingPortal, setLoadingPortal] = useState(false);
  useRealtimeSync();

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-link");
      if (error) throw error;
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed?.url) {
        window.location.href = parsed.url;
      } else {
        throw new Error(parsed?.error || "Failed to generate portal link");
      }
    } catch (err: any) {
      toast.error("Could not open subscription portal", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  // Filter nav based on role
  const visibleNav = role === "caregiver" ? navItems.filter((i) => i.path === "/parent-report") : navItems;

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={lexitrackLogo} alt="LexiTrack" className="h-8 w-auto" />
            {isPro && (
              <div className="flex items-center gap-0.5">
                <Badge
                  variant="secondary"
                  className="gap-1 text-xs font-bold bg-primary/10 text-primary border-primary/20"
                >
                  <Crown className="w-3 h-3" /> Pro
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                      <EllipsisVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={handleManageSubscription}
                      disabled={loadingPortal}
                      className="gap-2 cursor-pointer"
                    >
                      {loadingPortal ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5" />
                      )}
                      Manage Subscription
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </Link>

          <nav className="flex items-center gap-1">
            {visibleNav.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-primary/8 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            {user && (
              <Button variant="ghost" size="sm" onClick={signOut} className="ml-2 text-muted-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
};

export default AppLayout;
