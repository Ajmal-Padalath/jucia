import { Suspense } from "react";
import MenuPage from "./menu-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Digital Menu",
};

export default function MenuRoute() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl space-y-4 p-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-11 w-full" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        </div>
      }
    >
      <MenuPage />
    </Suspense>
  );
}
