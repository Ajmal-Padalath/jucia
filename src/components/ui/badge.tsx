import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
        secondary: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
        success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
        warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
        danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
        veg: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
        nonveg: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
        outline: "border border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
