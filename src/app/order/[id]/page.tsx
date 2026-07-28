"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Clock, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocket } from "@/hooks/use-socket";
import {
  formatCurrency,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  cn,
} from "@/lib/utils";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  estimatedTime?: number | null;
  createdAt: string;
  table: { number: number };
  customer?: { name: string } | null;
  items: {
    quantity: number;
    totalPrice: number;
    foodItem: { name: string };
    specialInstructions?: string | null;
  }[];
  feedback?: { rating: number } | null;
};

export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { socket } = useSocket();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const loadOrder = async () => {
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    if (data.success) {
      setOrder(data.data);
      if (data.data.feedback) setSubmitted(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (!socket || !orderId) return;
    socket.emit("join:order", orderId);
    const handler = (updated: Order) => {
      if (updated.id === orderId) {
        setOrder(updated);
        toast.info(`Order ${ORDER_STATUS_LABELS[updated.status] || updated.status}`);
      }
    };
    socket.on("order:update", handler);
    return () => {
      socket.off("order:update", handler);
    };
  }, [socket, orderId]);

  const submitFeedback = async () => {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, rating, comment }),
    });
    const data = await res.json();
    if (data.success) {
      setSubmitted(true);
      toast.success("Thanks for your feedback!");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Order not found</p>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(
    order.status as (typeof ORDER_STATUS_FLOW)[number]
  );
  const isCancelled = order.status === "CANCELLED";
  const showFeedback = ["SERVED", "COMPLETED"].includes(order.status);

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-5 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Badge className="mb-2">Table {order.table.number}</Badge>
        <h1 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Order Status</h1>
        <p className="mt-1 font-mono text-sm font-medium text-zinc-600 dark:text-zinc-300">{order.orderNumber}</p>
        {order.estimatedTime && order.status !== "SERVED" && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400">
            <Clock className="h-4 w-4" /> Est. {order.estimatedTime} min
          </p>
        )}
      </header>

      <div className="p-5">
        {isCancelled ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
            <p className="font-semibold text-red-600">Order Cancelled</p>
          </div>
        ) : (
          <div className="space-y-0">
            {ORDER_STATUS_FLOW.map((status, index) => {
              const done = currentIndex >= index;
              const active = currentIndex === index;
              return (
                <div key={status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition",
                        done
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-zinc-300 bg-white text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                      )}
                    >
                      {done ? <Check className="h-5 w-5" /> : index + 1}
                    </div>
                    {index < ORDER_STATUS_FLOW.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 flex-1 min-h-10",
                          currentIndex > index ? "bg-orange-500" : "bg-zinc-200 dark:bg-zinc-800"
                        )}
                      />
                    )}
                  </div>
                  <div className={cn("pb-8 pt-2", active && "animate-pulse")}>
                    <p
                      className={cn(
                        "font-semibold",
                        done ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                      )}
                    >
                      {ORDER_STATUS_LABELS[status]}
                    </p>
                    {active && (
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">In progress...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Order details</h2>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-zinc-800 dark:text-zinc-100">
                <span>
                  {item.quantity}× {item.foodItem.name}
                </span>
                <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-zinc-100 pt-3 font-bold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
            <span>Total</span>
            <span className="text-orange-600 dark:text-orange-400">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {showFeedback && !submitted && (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">How was your meal?</h2>
            <div className="mb-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star
                    className={cn(
                      "h-8 w-8",
                      n <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    )}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Tell us more (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-3"
            />
            <Button onClick={submitFeedback} className="w-full">
              Submit Feedback
            </Button>
          </div>
        )}

        {submitted && (
          <p className="mt-4 text-center text-sm text-emerald-600">
            Thank you for your feedback!
          </p>
        )}

        <Link href={`/menu?table=${order.table.number}`} className="mt-6 block">
          <Button variant="outline" className="w-full">
            Order more
          </Button>
        </Link>
      </div>
    </div>
  );
}
