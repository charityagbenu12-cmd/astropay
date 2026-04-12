import { notFound } from 'next/navigation';
import { PayWithFreighter } from '@/components/PayWithFreighter';
import { getInvoiceByPublicId } from '@/lib/data';
import { centsToUsd, isoToLocal } from '@/lib/format';

export default async function PayPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const invoice = await getInvoiceByPublicId(publicId);
  if (!invoice) notFound();

  return (
    <div className="grid two">
      <div className="card stack">
        <div className="badge">Pay {invoice.business_name}</div>
        <h1 style={{ margin: 0 }}>{invoice.description}</h1>
        <p>Amount: <strong>{centsToUsd(invoice.gross_amount_cents)}</strong></p>
        <p className="muted">USDC on Stellar</p>
        <p className="muted">Expires: {isoToLocal(invoice.expires_at)}</p>
        <p className="muted mono">Memo: {invoice.memo}</p>
        <p className="muted mono">Destination: {invoice.destination_public_key}</p>
      </div>
      <div className="stack">
        <div className="card stack">
          <div className="badge">QR checkout</div>
          {invoice.qr_data_url ? <img src={invoice.qr_data_url} alt="Invoice QR code" width={280} height={280} /> : null}
        </div>
        <PayWithFreighter invoiceId={invoice.id} status={invoice.status} />
      </div>
    </div>
  );
}
