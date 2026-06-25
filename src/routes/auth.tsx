import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Khakhi Pro" },
      { name: "description", content: "Sign in or create your Khakhi Pro account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/profile" });
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await signIn(fd.get("email") as string, fd.get("password") as string);
      toast.success("Welcome back!");
      navigate({ to: "/profile" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await signUp(
        fd.get("email") as string,
        fd.get("password") as string,
        fd.get("name") as string
      );
      toast.success("Account created! Check your email to confirm.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-md px-4 py-12 md:py-20">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--khakhi-navy)] text-[var(--khakhi-saffron)] mb-3">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Khakhi Pro</h1>
          <p className="text-muted-foreground text-sm mt-1">Gujarat Police exam preparation</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="si-password">Password</Label>
                  <Input id="si-password" name="password" type="password" required autoComplete="current-password" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[var(--khakhi-navy)] text-white hover:brightness-110">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="su-name">Full Name</Label>
                  <Input id="su-name" name="name" type="text" required />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="su-password">Password</Label>
                  <Input id="su-password" name="password" type="password" required minLength={6} autoComplete="new-password" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-[var(--khakhi-navy)] text-white hover:brightness-110">
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Shell>
  );
}
