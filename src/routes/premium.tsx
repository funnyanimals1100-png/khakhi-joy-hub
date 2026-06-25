import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";
import { Shell, PageHeader } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Premium — Khakhi Pro" },
      { name: "description", content: "Unlock all mock tests, previous papers, and offline PDFs." },
    ],
  }),
  component: PremiumPage,
});

const PLANS = [
  {
    name: "Monthly",
    price: "₹199",
    period: "/ month",
    features: ["All mock tests", "Detailed solutions", "Daily current affairs PDF", "Cancel anytime"],
  },
  {
    name: "6 Months",
    price: "₹899",
    period: "/ 6 months",
    badge: "Most Popular",
    features: [
      "Everything in Monthly",
      "Previous year papers",
      "Performance analytics",
      "Priority support",
    ],
  },
  {
    name: "Annual",
    price: "₹1499",
    period: "/ year",
    features: [
      "Everything in 6 Months",
      "Offline PDFs",
      "1-on-1 doubt sessions (4/year)",
      "Best value",
    ],
  },
];

function PremiumPage() {
  return (
    <Shell>
      <PageHeader title="Khakhi Pro Premium" subtitle="Unlock everything you need to crack the exam" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((p, i) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border bg-card p-6 ${i === 1 ? "border-[var(--khakhi-saffron)] shadow-lg md:-translate-y-2" : "border-border"}`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 text-xs font-semibold bg-[var(--khakhi-saffron)] text-[var(--khakhi-navy)] px-3 py-1 rounded-full">
                  <Crown className="h-3 w-3" /> {p.badge}
                </span>
              )}
              <h3 className="font-bold text-lg">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-muted-foreground text-sm">{p.period}</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[var(--khakhi-saffron-deep)] mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-6 w-full ${i === 1 ? "bg-[var(--khakhi-saffron)] text-[var(--khakhi-navy)] hover:brightness-110 font-semibold" : "bg-[var(--khakhi-navy)] text-white hover:brightness-110"}`}
              >
                Choose {p.name}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Payments coming soon. Get notified when Premium launches.
        </p>
      </div>
    </Shell>
  );
}
