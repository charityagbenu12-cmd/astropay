import { fail, ok } from '@/lib/http';
import { getInvoiceById } from '@/lib/data';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) return fail('Invoice not found', 404);
  return ok({ status: invoice.status, paidAt: invoice.paid_at, settledAt: invoice.settled_at });
}
