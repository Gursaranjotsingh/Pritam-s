import { z } from "zod";

// Indian mobile numbers: 10 digits, starting 6-9 (optionally with +91 / 91 prefix)
const indianPhone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(?:\+91|91)?[6-9]\d{9}$/.test(v), "Enter a valid Indian mobile number");

// Indian PIN codes: 6 digits, first digit 1-9
const indianPincode = z.string().refine((v) => /^[1-9][0-9]{5}$/.test(v), "Enter a valid 6-digit PIN code");

export const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  phone: indianPhone,
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address_line1: z.string().min(4, "Address is required").max(200),
  address_line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  pincode: indianPincode,
  payment_method: z.enum(["online", "cod"]),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1, "Your cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
