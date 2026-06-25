import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, BookOpen, ClipboardCheck, Newspaper, Bell, Crown, ArrowRight } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Khakhi Pro — Gujarat Police Exam Preparation" },
      {
        name: "description",
        content:
          "Crack Gujarat Police LRD, PSI & Constable exams with structured study material, mock tests & daily current affairs.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { icon: BookOpen, title: "Study Material", desc: "Subject-wise notes, PDFs and video lessons curated for Gujarat Police syllabus.", to: "/study" },
  { icon: ClipboardCheck, title: "Mock Tests", desc: "Full-length and topic-wise mocks with instant scoring and analytics.", to: "/tests" },
  { icon: Newspaper, title: "Daily News", desc: "Latest exam-relevant news in Gujarati and English.", to: "/news" },
  { icon: Bell, title: "Current Affairs", desc: "Daily, weekly and monthly current affairs digest.", to: "/current-affairs" },
] as const;

function Home() {
  return (
    <Shell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--khakhi-navy)] text-white">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, var(--khakhi-saffron) 0%, transparent 40%), radial-gradient(circle at 80% 80%, oklch(0.4 0.1 265) 0%, transparent 50%)",
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm mb-6">
              <Shield className="h-4 w-4 text-[var(--khakhi-saffron)]" />
              <span>Gujarat Police Exam Prep</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Wear the <span className="text-[var(--khakhi-saffron)]">Khakhi</span>.
              <br />
              Start preparing today.
            </h1>
            <p className="mt-5 text-lg text-white/80 max-w-lg">
              Everything you need to crack LRD, PSI and Constable — study material, mock tests, and daily current affairs in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="bg-[var(--khakhi-saffron)] text-[var(--khakhi-navy)] hover:brightness-110 font-semibold">
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/tests">
                <Button size="lg" variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10">
                  Try a Mock Test
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex gap-6 text-sm text-white/70">
              <div><div className="text-2xl font-bold text-white">10k+</div>Active aspirants</div>
              <div><div className="text-2xl font-bold text-white">500+</div>Mock tests</div>
              <div><div className="text-2xl font-bold text-white">Daily</div>Current affairs</div>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="absolute -inset-4 bg-gradient-to-br from-[var(--khakhi-saffron)]/30 to-transparent blur-3xl rounded-full" />
            <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-white/60">Today's Mock</span>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--khakhi-saffron)] text-[var(--khakhi-navy)] font-semibold">LIVE</span>
              </div>
              <h3 className="text-xl font-semibold">LRD Full Mock #42</h3>
              <p className="text-sm text-white/60 mt-1">100 questions · 60 minutes</p>
              <div className="mt-4 space-y-2">
                {["Gujarati Grammar", "Reasoning", "General Knowledge", "Current Affairs"].map((t) => (
                  <div key={t} className="flex items-center justify-between bg-white/5 rounded-md px-3 py-2 text-sm">
                    <span>{t}</span>
                    <span className="text-white/50">25 Q</span>
                  </div>
                ))}
              </div>
              <Link to="/tests" className="mt-5 block">
                <Button className="w-full bg-[var(--khakhi-saffron)] text-[var(--khakhi-navy)] hover:brightness-110 font-semibold">
                  Start Test
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Everything you need to succeed</h2>
          <p className="mt-3 text-muted-foreground">
            Built specifically for Gujarat Police aspirants. No fluff. Just focused prep.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="group rounded-xl border border-border bg-card p-6 hover:border-[var(--khakhi-saffron)] hover:shadow-lg transition-all"
            >
              <div className="h-11 w-11 rounded-lg bg-[var(--khakhi-navy)] text-[var(--khakhi-saffron)] flex items-center justify-center">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              <span className="mt-3 inline-flex items-center text-sm text-[var(--khakhi-saffron-deep)] group-hover:gap-2 gap-1 transition-all">
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Premium CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--khakhi-navy)] to-[oklch(0.18_0.07_265)] text-white p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--khakhi-saffron)]/20 text-[var(--khakhi-saffron)] text-sm">
              <Crown className="h-4 w-4" /> Khakhi Pro Premium
            </div>
            <h3 className="mt-3 text-2xl md:text-3xl font-bold">Unlock all mock tests & previous papers</h3>
            <p className="mt-2 text-white/70 max-w-xl">
              Get unlimited access to mocks, detailed solutions, and offline PDFs.
            </p>
          </div>
          <Link to="/premium">
            <Button size="lg" className="bg-[var(--khakhi-saffron)] text-[var(--khakhi-navy)] hover:brightness-110 font-semibold">
              See Plans
            </Button>
          </Link>
        </div>
      </section>
    </Shell>
  );
}
