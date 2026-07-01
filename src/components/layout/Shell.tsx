import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Moon, Sun, Shield, LogOut, X, Languages } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/study", label: "Study" },
  { to: "/tests", label: "Tests" },
  { to: "/news", label: "News" },
  { to: "/current-affairs", label: "Current Affairs" },
  { to: "/notifications", label: "Notifications" },
  { to: "/premium", label: "Premium" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-[var(--khakhi-navy)] text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Shield className="h-6 w-6 text-[var(--khakhi-saffron)]" />
            <span>
              Khakhi <span className="text-[var(--khakhi-saffron)]">Pro</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors hover:bg-white/10",
                  pathname === item.to && "bg-white/15 text-[var(--khakhi-saffron)]"
                )}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors hover:bg-white/10",
                  pathname === "/admin" && "bg-white/15 text-[var(--khakhi-saffron)]"
                )}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              aria-label="Toggle language"
              title={lang === "gu" ? "Switch to English" : "ગુજરાતીમાં બદલો"}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-xs font-semibold"
            >
              <Languages className="h-4 w-4" />
              <span>{lang === "gu" ? "ગુજ" : "EN"}</span>
            </button>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/profile"
                  className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20"
                >
                  Profile
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-md hover:bg-white/10"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="hidden md:inline-flex bg-[var(--khakhi-saffron)] text-[var(--khakhi-navy)] font-semibold px-4 py-1.5 rounded-md text-sm hover:brightness-110"
              >
                Sign in
              </Link>
            )}
            <button
              onClick={() => setOpen((o) => !o)}
              className="md:hidden p-2 rounded-md hover:bg-white/10"
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-white/10 bg-[var(--khakhi-navy)] px-4 py-3 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm rounded-md hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2 text-sm rounded-md hover:bg-white/10">
                Admin
              </Link>
            )}
            {user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="px-3 py-2 text-sm rounded-md hover:bg-white/10">
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex justify-center bg-[var(--khakhi-saffron)] text-[var(--khakhi-navy)] font-semibold px-4 py-2 rounded-md text-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-[var(--khakhi-navy)] text-white/80 py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 text-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Khakhi Pro — Gujarat Police Exam Prep</p>
          <p className="text-white/60">LRD · PSI · Constable</p>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-border bg-gradient-to-r from-[var(--khakhi-navy)] to-[oklch(0.25_0.08_265)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 text-white/75">{subtitle}</p>}
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h2 className="text-xl font-semibold">Sign in required</h2>
        <p className="mt-2 text-muted-foreground">Please sign in to view this page.</p>
        <Link to="/auth" className="mt-4 inline-block">
          <Button>Go to sign in</Button>
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
