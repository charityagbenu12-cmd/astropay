import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentMerchant } from '@/lib/auth';
import { getMerchantInvoice } from '@/lib/data';
import { centsToUsd, isoToLocal } from '@/lib/format';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect('/login');
  const { id } = await params;
  const invoice = await getMerchantInvoice(merchant.id, id);
  if (!invoice) notFound();

  return (
    <div className="grid two">
      <div className="card stack">
        <div className="badge">Invoice</div>
        <h1 style={{ margin: 0 }}>{invoice.description}</h1>
        <p className="muted">Status: <strong>{invoice.status}</strong></p>
        <p>Gross: <strong>{centsToUsd(invoice.gross_amount_cents)}</strong></p>
        <p>Platform fee: <strong>{centsToUsd(invoice.platform_fee_cents)}</strong></p>
        <p>Merchant net: <strong>{centsToUsd(invoice.net_amount_cents)}</strong></p>
        <p className="muted mono">Public link: {invoice.checkout_url}</p>
        <p className="muted mono">Memo: {invoice.memo}</p>
        <p className="muted">Created: {isoToLocal(invoice.created_at)}</p>
        <p className="muted">Expires: {isoToLocal(invoice.expires_at)}</p>
        <div className="row">
          <a className="button" href={invoice.checkout_url || '#'} target="_blank">Open checkout</a>
          <Link className="button secondary" href="/dashboard">Back</Link>
        </div>
      </div>
      <div className="card stack">
        <div className="badge">QR</div>
        {invoice.qr_data_url ? <img src={invoice.qr_data_url} alt="Invoice QR code" width={280} height={280} /> : null}
      </div>
    </div>
  );
}
