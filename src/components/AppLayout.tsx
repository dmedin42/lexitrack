import { motion } from "framer-motion";
import { BarChart3, FileText, Settings, PlusCircle, LogOut, BookOpen } from "lucide-react";
import lexitrackLogo from "@/assets/lexitrack-logo.png";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

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
  useRealtimeSync();

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
