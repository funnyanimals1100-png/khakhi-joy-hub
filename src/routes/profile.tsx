import { createFileRoute } from "@tanstack/react-router";
import { User, Mail, Shield, LogOut, GraduationCap } from "lucide-react";
import { Shell, PageHeader, RequireAuth } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Khakhi Pro" },
      { name: "description", content: "Your Khakhi Pro account." },
    ],
  }),
  component: () => (
    <Shell>
      <PageHeader title="My Profile" />
      <RequireAuth>
        <ProfileInner />
      </RequireAuth>
    </Shell>
  ),
});

function ProfileInner() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const name = profile?.name || (user?.user_metadata?.name as string) || "Aspirant";
  const avatar = profile?.avatar_url;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt={name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-[var(--khakhi-navy)] text-[var(--khakhi-saffron)] flex items-center justify-center text-2xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">{name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {profile?.exam_type && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-[var(--khakhi-navy)] px-2 py-0.5 rounded">
                  <GraduationCap className="h-3 w-3" /> {profile.exam_type}
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--khakhi-saffron-deep)] bg-[var(--khakhi-saffron)]/15 px-2 py-0.5 rounded">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{profile?.email || user?.email}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">User ID:</span>
            <span className="font-mono text-xs">{user?.id?.slice(0, 8)}…</span>
          </div>
          {profile?.created_at && (
            <div className="text-xs text-muted-foreground px-3">
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </div>
          )}
        </div>

        <Button onClick={() => signOut()} variant="outline" className="mt-6 w-full">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}
