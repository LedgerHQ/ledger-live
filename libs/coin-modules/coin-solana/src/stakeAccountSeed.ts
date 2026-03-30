import { v4 as uuid } from "uuid";

/**
 * Solana PublicKey.createWithSeed enforces a maximum seed length of 32 bytes.
 * We use a short prefix and a truncated UUID to stay within this limit.
 */
export const STAKE_SEED_PREFIX = "stake:";
const STAKE_SEED_MAX_BYTES = 32;
const MAX_RANDOM_PART_LENGTH = STAKE_SEED_MAX_BYTES - STAKE_SEED_PREFIX.length;

/**
 * Returns a seed string suitable for getStakeAccountAddressWithSeed / createWithSeed.
 * Guaranteed to be <= 32 bytes (ASCII) so Solana's createWithSeed accepts it.
 */
export function createStakeAccountSeed(): string {
  const hexPart = uuid().replace(/-/g, "").slice(0, MAX_RANDOM_PART_LENGTH);
  return `${STAKE_SEED_PREFIX}${hexPart}`;
}
