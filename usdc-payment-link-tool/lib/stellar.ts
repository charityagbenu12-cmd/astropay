import QRCode from 'qrcode';
import { Asset, BASE_FEE, Horizon, Keypair, Memo, Operation, TransactionBuilder } from 'stellar-sdk';
import { env } from '@/lib/env';
import { amountToStellar } from '@/lib/format';
import type { Invoice } from '@/lib/types';

export const getServer = () => new Horizon.Server(env.horizonUrl);
export const getAsset = () => new Asset(env.assetCode, env.assetIssuer);
export const invoiceAmountToAsset = (invoice: Pick<Invoice, 'gross_amount_cents'>) => amountToStellar(invoice.gross_amount_cents);

export const buildCheckoutUrl = (publicId: string) => `${env.publicAppUrl}/pay/${publicId}`;

export const buildPaymentUri = (invoice: Invoice) => {
  const amount = encodeURIComponent(invoiceAmountToAsset(invoice));
  const destination = encodeURIComponent(invoice.destination_public_key);
  const assetCode = encodeURIComponent(invoice.asset_code);
  const issuer = encodeURIComponent(invoice.asset_issuer);
  const memo = encodeURIComponent(invoice.memo);
  return `web+stellar:pay?destination=${destination}&amount=${amount}&asset_code=${assetCode}&asset_issuer=${issuer}&memo=${memo}&memo_type=text`;
};

export const createQrDataUrl = async (invoice: Invoice) => QRCode.toDataURL(buildCheckoutUrl(invoice.public_id), { width: 280, margin: 1 });

export const buildBuyerPaymentXdr = async (payerPublicKey: string, invoice: Invoice) => {
  const server = getServer();
  const source = await server.loadAccount(payerPublicKey);
  const tx = new TransactionBuilder(source, {
    fee: String(Number(BASE_FEE) * 10),
    networkPassphrase: env.networkPassphrase,
  })
    .addOperation(Operation.payment({
      destination: invoice.destination_public_key,
      asset: getAsset(),
      amount: invoiceAmountToAsset(invoice),
    }))
    .addMemo(Memo.text(invoice.memo))
    .setTimeout(180)
    .build();

  return tx.toXDR();
};

export const submitSignedXdr = async (signedXdr: string) => {
  const tx = TransactionBuilder.fromXDR(signedXdr, env.networkPassphrase);
  return getServer().submitTransaction(tx);
};

export const findPaymentForInvoice = async (invoice: Invoice) => {
  const page = await getServer().payments().forAccount(invoice.destination_public_key).order('desc').limit(50).call();
  for (const record of page.records as any[]) {
    if (record.type !== 'payment') continue;
    if ((record.to || record.account) !== invoice.destination_public_key) continue;
    if (record.asset_code !== invoice.asset_code || record.asset_issuer !== invoice.asset_issuer) continue;
    if (Number(record.amount).toFixed(2) !== invoiceAmountToAsset(invoice)) continue;
    const tx = await getServer().transactions().transaction(record.transaction_hash).call();
    if (tx.memo === invoice.memo) {
      return { hash: record.transaction_hash, payment: record, memo: tx.memo };
    }
  }
  return null;
};

export const buildSettlementXdr = async ({ invoice, destination }: { invoice: Invoice; destination: string }) => {
  if (!env.platformTreasurySecretKey) throw new Error('Settlement signing key is missing');
  const server = getServer();
  const treasury = Keypair.fromSecret(env.platformTreasurySecretKey);
  const source = await server.loadAccount(treasury.publicKey());
  const tx = new TransactionBuilder(source, {
    fee: String(Number(BASE_FEE) * 10),
    networkPassphrase: env.networkPassphrase,
  })
    .addOperation(Operation.payment({
      destination,
      asset: getAsset(),
      amount: (invoice.net_amount_cents / 100).toFixed(2),
    }))
    .addMemo(Memo.text(`settle_${invoice.public_id}`.slice(0, 28)))
    .setTimeout(180)
    .build();
  tx.sign(treasury);
  return tx;
};
