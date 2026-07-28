"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validations";
import type { z } from "zod";

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@restaurant.com", password: "admin123" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }
      toast.success("Welcome back! ");
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;
      if (role === "KITCHEN") router.push("/kitchen");
      else if (role === "WAITER") router.push("/waiter");
      else router.push("/admin");
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(249,115,22,0.2),_transparent_55%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Staff Login</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Admin, kitchen & waiter access
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="mt-1.5" {...register("email")} />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              className="mt-1.5"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 dark:text-zinc-300 dark:bg-zinc-800">
          <p className="font-medium text-zinc-800 dark:text-zinc-100">Demo accounts</p>
          <p className="mt-1">admin@restaurant.com</p>
          <p>kitchen@restaurant.com</p>
          <p>waiter@restaurant.com</p>
          <p className="mt-1">Password: admin123</p>
        </div>

        <Link
          href="/"
          className="mt-4 block text-center text-sm text-orange-600 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
