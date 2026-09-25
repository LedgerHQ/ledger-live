import crypto, { type BinaryLike } from 'node:crypto';

export function md5(value: BinaryLike | string): string {
  return crypto.createHash('md5').update(value).digest('hex');
}
