import { registerSchema } from '@/lib/validators';
import { fail, ok } from '@/lib/http';
import { createMerchant, findMerchantByEmail } from '@/lib/data';
import { hashPassword } from '@/lib/security';
import { createSession } from '@/lib/auth';
import { assertCoreConfig } from '@/lib/env';

export async function POST(request: Request) {
  try {
    assertCoreConfig();
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid payload');
    const existing = await findMerchantByEmail(parsed.data.email);
    if (existing) return fail('A merchant with that email already exists', 409);
    const passwordHash = await hashPassword(parsed.data.password);
    const merchant = await createMerchant({
      email: parsed.data.email,
      passwordHash,
      businessName: parsed.data.businessName,
      stellarPublicKey: parsed.data.stellarPublicKey,
      settlementPublicKey: parsed.data.settlementPublicKey,
    });
    await createSession(merchant.id);
    return ok({ merchant });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Unexpected error', 500);
  }
}
