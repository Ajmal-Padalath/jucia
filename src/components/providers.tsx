"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/hooks/use-socket";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
        <SocketProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </SocketProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
