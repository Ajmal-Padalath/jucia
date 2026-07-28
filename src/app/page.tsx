import Link from "next/link";
import {
  ArrowRight,
  ChefHat,
  QrCode,
  Smartphone,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.18),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(24,24,27,0.08),_transparent_45%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.03),_transparent_45%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Orange Flame
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm">
              Staff Login
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-10 text-center md:pt-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-300 animate-float-in">
          <QrCode className="h-4 w-4" />
          QR Table Ordering
        </div>

        <h1 className="font-display max-w-3xl text-5xl font-semibold leading-[1.1] tracking-tight text-zinc-900 dark:text-white md:text-7xl animate-float-in">
          Orange Flame
          <span className="block text-orange-500">Kitchen</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-zinc-700 dark:text-zinc-300 animate-float-in">
          Scan your table QR, browse the menu, customize dishes, and track your
          order live — no account needed.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-float-in">
          <Link href="/menu?table=1">
            <Button size="lg" className="gap-2">
              Open Demo Menu
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Kitchen & Admin
            </Button>
          </Link>
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: Smartphone,
              title: "Scan & Order",
              desc: "Unique QR per table opens the digital menu instantly.",
            },
            {
              icon: ChefHat,
              title: "Live Kitchen",
              desc: "Orders stream to kitchen and waiter dashboards in real time.",
            },
            {
              icon: QrCode,
              title: "Manage Tables",
              desc: "Generate QR codes, track tables, and run reports.",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200/80 bg-white/70 p-6 text-left backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 animate-float-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-300">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
