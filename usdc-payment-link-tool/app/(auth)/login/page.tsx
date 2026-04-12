import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/AuthForm';
import { getCurrentMerchant } from '@/lib/auth';

export default async function LoginPage() {
  const merchant = await getCurrentMerchant();
  if (merchant) redirect('/dashboard');
  return <AuthForm mode="login" />;
}
