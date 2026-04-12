import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="stack">
      <section className="hero">
        <div className="badge">ASTROpay v2</div>
        <h1>Hosted USDC payment links on Stellar, now with real merchant ops.</h1>
        <p>Postgres-backed invoices, merchant auth, reconciliation, payout queue, and a production deployment path for Vercel or Railway.</p>
        <div className="row">
          <Link href="/register" className="button">Create merchant account</Link>
          <Link href="/login" className="button secondary">Sign in</Link>
        </div>
      </section>
      <section className="grid two">
        <div className="card stack"><div className="badge">Persistent invoices</div><h3>No more signed-token ghost links.</h3><p className="muted">Every invoice is stored, queryable, and auditable in Postgres.</p></div>
        <div className="card stack"><div className="badge">Fee-split architecture</div><h3>Platform collects, merchants settle net.</h3><p className="muted">This is actual ledgered fee capture, not a UI fiction.</p></div>
        <div className="card stack"><div className="badge">Reconciliation</div><h3>Cron scans Horizon and closes the accounting loop.</h3><p className="muted">Pending invoices are reconciled independently of the checkout session.</p></div>
        <div className="card stack"><div className="badge">Deployable</div><h3>Ready for Vercel or Railway.</h3><p className="muted">Includes env spec, SQL migrations, Docker, and cron endpoints.</p></div>
      </section>
    </div>
  );
}
