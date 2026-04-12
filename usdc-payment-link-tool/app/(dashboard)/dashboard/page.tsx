import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentMerchant } from '@/lib/auth';
import { listMerchantInvoices } from '@/lib/data';
import { centsToUsd, isoToLocal } from '@/lib/format';
import type { Invoice } from '@/lib/types';

export default async function DashboardPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect('/login');
  const invoices = await listMerchantInvoices(merchant.id);
  const paidVolume = invoices
    .filter((invoice: Invoice) => ['paid', 'settled'].includes(invoice.status))
    .reduce((sum: number, invoice: Invoice) => sum + invoice.net_amount_cents, 0);
  return (
    <div className="stack">
      <div className="grid two">
        <div className="card stack"><div className="badge">Merchant</div><h1 style={{ margin: 0 }}>{merchant.business_name}</h1><p className="muted mono">Settlement wallet: {merchant.settlement_public_key}</p></div>
        <div className="card stack"><div className="badge">Net volume</div><div className="stat">{centsToUsd(paidVolume)}</div><Link href="/dashboard/invoices/new" className="button">Create invoice</Link></div>
      </div>
      <div className="card stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Invoices</h2>
          <Link href="/dashboard/invoices/new" className="button secondary">New invoice</Link>
        </div>
        <table>
          <thead><tr><th>Description</th><th>Status</th><th>Gross</th><th>Net</th><th>Created</th></tr></thead>
          <tbody>
            {invoices.map((invoice: Invoice) => (
              <tr key={invoice.id}>
                <td><Link href={`/dashboard/invoices/${invoice.id}`}>{invoice.description}</Link></td>
                <td>{invoice.status}</td>
                <td>{centsToUsd(invoice.gross_amount_cents)}</td>
                <td>{centsToUsd(invoice.net_amount_cents)}</td>
                <td>{isoToLocal(invoice.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
