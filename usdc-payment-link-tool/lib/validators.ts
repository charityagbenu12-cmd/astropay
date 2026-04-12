import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2).max(120),
  stellarPublicKey: z.string().startsWith('G').min(56).max(56),
  settlementPublicKey: z.string().startsWith('G').min(56).max(56),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const invoiceSchema = z.object({
  description: z.string().min(2).max(240),
  amountUsd: z.coerce.number().positive().max(1000000),
});
