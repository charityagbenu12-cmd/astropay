import { redirect } from 'next/navigation';
import { getCurrentMerchant } from '@/lib/auth';
import { InvoiceCreateForm } from '@/components/InvoiceCreateForm';

export default async function NewInvoicePage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect('/login');
  return <InvoiceCreateForm />;
}
