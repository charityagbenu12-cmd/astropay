import { loginSchema } from '@/lib/validators';
import { fail, ok } from '@/lib/http';
import { findMerchantByEmail } from '@/lib/data';
import { verifyPassword } from '@/lib/security';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid payload');
    const merchant = await findMerchantByEmail(parsed.data.email);
    if (!merchant) return fail('Invalid credentials', 401);
    const valid = await verifyPassword(parsed.data.password, merchant.password_hash);
    if (!valid) return fail('Invalid credentials', 401);
    await createSession(merchant.id);
    return ok({ merchant: { id: merchant.id, email: merchant.email, businessName: merchant.business_name } });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Unexpected error', 500);
  }
}
