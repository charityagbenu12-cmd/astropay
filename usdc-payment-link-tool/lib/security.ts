import crypto from 'node:crypto';

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

export const hashPassword = async (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, SCRYPT_PARAMS, (err, key) => err ? reject(err) : resolve(key));
  });
  return `${salt}:${derived.toString('hex')}`;
};

export const verifyPassword = async (password: string, storedHash: string) => {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, SCRYPT_PARAMS, (err, key) => err ? reject(err) : resolve(key));
  });
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
};

export const generatePublicId = () => `inv_${crypto.randomBytes(8).toString('hex')}`;
export const generateMemo = () => `astro_${crypto.randomBytes(6).toString('hex')}`;
