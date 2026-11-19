import { getAccountCanonicalAddress } from "../../network/proxyClient";
import type { ConcordiumCoinConfig } from "../../types";
import { accountKey } from "./sameAccount";

/**
 * An account has 2^24 addresses (aliases). The chain names the alias a party
 * used, so one account shows up under several addresses. Its canonical address,
 * the one it was created with, cannot be derived from an alias: the node knows
 * it, and the wallet proxy exposes it.
 *
 * The mapping never changes once the account exists, so it is cached per
 * account (all its aliases share one entry), for the life of the process.
 */
const MAX_CACHED_ACCOUNTS = 100_000;
const CACHE = new Map<string, Promise<string>>();

/** The proxy's answer for an account that is not finalized yet, as opposed to an unknown route on an older proxy. */
const ACCOUNT_DOES_NOT_EXIST = "Account does not exist";

/** `@ledgerhq/live-network` throws HTTP errors with the status and the body's `errorMessage`. */
function isMissingAccount(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const { status } = error as Error & { status?: number };
  return status === 404 && error.message === ACCOUNT_DOES_NOT_EXIST;
}

/**
 * The canonical address of the account `address` belongs to.
 *
 * Returns `address` unchanged when it is not an account address, or when the
 * account is not finalized yet (it was just created): that answer is not cached.
 * Any other failure, including a proxy without the endpoint, is thrown.
 */
export function toCanonicalAddress(
  config: ConcordiumCoinConfig,
  currencyId: string,
  address: string,
): Promise<string> {
  const account = accountKey(address);
  if (account === undefined) return Promise.resolve(address);

  const key = `${currencyId}:${account}`;
  const cached = CACHE.get(key);
  if (cached) return cached;

  const resolved = getAccountCanonicalAddress(config, currencyId, address).then(
    response => response.accountAddress,
    error => {
      CACHE.delete(key);
      if (isMissingAccount(error)) return address;
      throw error;
    },
  );
  CACHE.set(key, resolved);
  if (CACHE.size > MAX_CACHED_ACCOUNTS) {
    // Maps iterate in insertion order: drop the oldest entry.
    const oldest = CACHE.keys().next().value;
    if (oldest !== undefined) CACHE.delete(oldest);
  }
  return resolved;
}

/** Canonical address of each distinct address, keyed by the given address. */
export async function toCanonicalAddresses(
  config: ConcordiumCoinConfig,
  currencyId: string,
  addresses: Iterable<string>,
): Promise<Map<string, string>> {
  const distinct = [...new Set(addresses)];
  const canonical = await Promise.all(
    distinct.map(address => toCanonicalAddress(config, currencyId, address)),
  );
  return new Map(distinct.map((address, index) => [address, canonical[index]]));
}

/** For tests only. */
export function clearCanonicalAddressCache(): void {
  CACHE.clear();
}
