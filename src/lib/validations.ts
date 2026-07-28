import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  specialRequest: z.string().optional(),
  paymentMethod: z.enum(["PAY_AT_COUNTER", "CASH", "CARD", "ONLINE"]),
  couponCode: z.string().optional(),
  tableId: z.string().min(1),
});

export const foodItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  categoryId: z.string().min(1),
  isVeg: z.boolean().default(true),
  prepTime: z.coerce.number().int().positive().default(15),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  ingredients: z.array(z.string()).default([]),
  image: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const tableSchema = z.object({
  number: z.coerce.number().int().positive(),
  capacity: z.coerce.number().int().positive().default(4),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const cartItemSchema = z.object({
  foodItemId: z.string(),
  name: z.string(),
  image: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  spiceLevel: z.enum(["MILD", "MEDIUM", "HOT", "EXTRA_HOT"]).optional(),
  size: z.string().optional(),
  selectedExtras: z
    .array(z.object({ id: z.string(), name: z.string(), price: z.number() }))
    .optional(),
  specialInstructions: z.string().optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const feedbackSchema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
