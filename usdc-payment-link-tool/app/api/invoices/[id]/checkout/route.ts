import { fail, ok } from '@/lib/http';
import { getInvoiceById } from '@/lib/data';
import { buildBuyerPaymentXdr, submitSignedXdr } from '@/lib/stellar';
import { env } from '@/lib/env';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await getInvoiceById(id);
    if (!invoice) return fail('Invoice not found', 404);
    const body = await request.json();
    if (body.mode === 'build-xdr') {
      const payer = String(body.payer || '');
      if (!payer) return fail('Missing payer public key');
      const xdr = await buildBuyerPaymentXdr(payer, invoice);
      return ok({ xdr, networkPassphrase: env.networkPassphrase });
    }
    if (body.mode === 'submit-xdr') {
      const signedXdr = String(body.signedXdr || '');
      if (!signedXdr) return fail('Missing signed XDR');
      const submission = await submitSignedXdr(signedXdr);
      return ok({ hash: submission.hash });
    }
    return fail('Unsupported mode');
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Unexpected error', 500);
  }
}
