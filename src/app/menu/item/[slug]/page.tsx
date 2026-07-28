import { Suspense } from "react";
import FoodDetailPage from "./detail-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function FoodItemRoute() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg space-y-4 p-4">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      }
    >
      <FoodDetailPage />
    </Suspense>
  );
}
