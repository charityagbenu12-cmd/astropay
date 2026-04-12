import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getCurrentMerchant } from '@/lib/auth';

export const metadata = {
  title: 'ASTROpay',
  description: 'Stripe-style USDC invoices on Stellar for modern merchants.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const merchant = await getCurrentMerchant();
  return (
    <html lang="en">
      <body>
        <main>
          <nav>
            <Link href="/" className="brand">ASTROpay</Link>
            <div className="row small muted">
              {merchant ? <>
                <Link href="/dashboard">Dashboard</Link>
                <form action="/api/auth/logout" method="post"><button className="button secondary">Logout</button></form>
              </> : <>
                <Link href="/login">Login</Link>
                <Link href="/register" className="button">Start selling</Link>
              </>}
            </div>
          </nav>
          {children}
        </main>
      </body>
    </html>
  );
}
