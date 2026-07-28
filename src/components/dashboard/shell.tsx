"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  ClipboardList,
  Grid3X3,
  BarChart3,
  LogOut,
  ChefHat,
  ConciergeBell,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/tables", label: "Tables", icon: Grid3X3 },
  { href: "/admin/qr", label: "QR Codes", icon: QrCode },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export function DashboardShell({
  children,
  title,
  links,
}: {
  children: React.ReactNode;
  title: string;
  links?: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const nav = links || adminLinks;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-5 dark:border-zinc-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Orange Flame</p>
            <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">{session?.user?.role}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/admin" &&
                link.href !== "/kitchen" &&
                link.href !== "/waiter" &&
                pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          {session?.user?.role === "ADMIN" && (
            <>
              <Link
                href="/kitchen"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <ChefHat className="h-4 w-4" />
                Kitchen
              </Link>
              <Link
                href="/waiter"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <ConciergeBell className="h-4 w-4" />
                Waiter
              </Link>
            </>
          )}
        </nav>
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 md:px-6">
          <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-medium text-zinc-600 dark:text-zinc-300 sm:inline">
              {session?.user?.email}
            </span>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
          {nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium",
                pathname === link.href
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
