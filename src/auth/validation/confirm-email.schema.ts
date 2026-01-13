import z from "zod";

export const confirmEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().min(4, "OTP must be at least 4 characters").max(10, "OTP must be at most 10 characters"),
});

