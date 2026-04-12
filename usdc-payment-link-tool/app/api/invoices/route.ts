import { assertCoreConfig } from '@/lib/env';
import { fail, ok } from '@/lib/http';
import { requireMerchant } from '@/lib/auth';
import { createInvoice, listMerchantInvoices } from '@/lib/data';
import { invoiceSchema } from '@/lib/validators';

export async function GET() {
  try {
    const merchant = await requireMerchant();
    return ok({ invoices: await listMerchantInvoices(merchant.id) });
  } catch {
    return fail('Unauthorized', 401);
  }
}

export async function POST(request: Request) {
  try {
    const merchant = await requireMerchant();
    assertCoreConfig();
    const parsed = invoiceSchema.safeParse(await request.json());
    if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid payload');
    const invoice = await createInvoice({
      merchantId: merchant.id,
      description: parsed.data.description,
      amountCents: Math.round(parsed.data.amountUsd * 100),
    });
    return ok({ invoice });
  } catch (error) {
    return fail(error instanceof Error && error.message === 'Unauthorized' ? 'Unauthorized' : (error instanceof Error ? error.message : 'Unexpected error'), error instanceof Error && error.message === 'Unauthorized' ? 401 : 500);
  }
}
