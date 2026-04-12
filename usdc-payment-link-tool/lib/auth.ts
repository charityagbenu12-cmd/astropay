import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { query } from '@/db';
import { env } from '@/lib/env';
import type { Merchant } from '@/lib/types';

const SESSION_COOKIE = 'astropay_session';
const secret = new TextEncoder().encode(env.sessionSecret);

const baseSelect = `SELECT id, email, business_name, stellar_public_key, settlement_public_key, created_at FROM merchants`;

export async function createSession(merchantId: string) {
  const result = await query<{ id: string }>(
    `INSERT INTO sessions (merchant_id, expires_at) VALUES ($1, NOW() + interval '30 days') RETURNING id`,
    [merchantId],
  );

  const token = await new SignJWT({ sid: result.rows[0].id, sub: merchantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getCurrentMerchant(): Promise<Merchant | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secret);
    const sessionId = verified.payload.sid as string;
    const merchantId = verified.payload.sub as string;
    const result = await query<Merchant>(
      `${baseSelect} WHERE id = $1 AND EXISTS (
         SELECT 1 FROM sessions WHERE id = $2 AND merchant_id = $1 AND expires_at > NOW()
       )`,
      [merchantId, sessionId],
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

export async function requireMerchant() {
  const merchant = await getCurrentMerchant();
  if (!merchant) {
    throw new Error('Unauthorized');
  }
  return merchant;
}
