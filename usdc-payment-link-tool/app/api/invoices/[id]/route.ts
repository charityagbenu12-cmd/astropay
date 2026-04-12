import { fail, ok } from '@/lib/http';
import { getMerchantInvoice } from '@/lib/data';
import { requireMerchant } from '@/lib/auth';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const merchant = await requireMerchant();
    const { id } = await params;
    const invoice = await getMerchantInvoice(merchant.id, id);
    if (!invoice) return fail('Invoice not found', 404);
    return ok({ invoice });
  } catch {
    return fail('Unauthorized', 401);
  }
}
