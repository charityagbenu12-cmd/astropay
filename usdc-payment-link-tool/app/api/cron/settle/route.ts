import { fail, ok } from '@/lib/http';
import { assertSettlementConfig, env } from '@/lib/env';
import { buildSettlementXdr, getServer } from '@/lib/stellar';
import { getInvoiceById, markPayoutFailed, markPayoutSettled, markPayoutSubmitted, queuedPayouts } from '@/lib/data';

function authorized(request: Request) {
  const auth = request.headers.get('authorization');
  const bearer = auth?.replace('Bearer ', '');
  return bearer && bearer === env.cronSecret;
}

export async function GET(request: Request) {
  if (!authorized(request)) return fail('Unauthorized', 401);
  assertSettlementConfig();
  const payouts = await queuedPayouts();
  const results: Array<Record<string, unknown>> = [];

  for (const payout of payouts) {
    try {
      const invoice = await getInvoiceById(payout.invoice_id_ref);
      if (!invoice || invoice.status !== 'paid') continue;
      const tx = await buildSettlementXdr({ invoice, destination: payout.destination_public_key });
      const submission = await getServer().submitTransaction(tx);
      await markPayoutSubmitted(payout.id, submission.hash);
      await markPayoutSettled(payout.id, payout.invoice_id_ref, submission.hash);
      results.push({ payoutId: payout.id, action: 'settled', txHash: submission.hash });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Settlement failed';
      await markPayoutFailed(payout.id, message);
      results.push({ payoutId: payout.id, action: 'failed', reason: message });
    }
  }

  return ok({ processed: payouts.length, results });
}
