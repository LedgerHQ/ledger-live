import { RecipientRequired } from "@ledgerhq/ledger-wallet-framework/errors";
import { makeLRUCache, type CacheRes } from "@ledgerhq/live-network/cache";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account } from "@ledgerhq/types-live";
import getFeesForTransaction from "./getFeesForTransaction";
import { isValidRecipient } from "./logic";
import type { Transaction } from "./types";
import type { BitcoinCoinConfig } from "./config";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import {
  DEFAULT_EXPLORER_BATCH_SIZE,
  DEFAULT_FEE_CALCULATION_CACHE_TTL_MS,
  DEFAULT_RBF_MIN_BUMP_RATIO,
} from "./constants";
import { Currency, isTaprootAddress } from "@ledgerhq/wallet-btc/index";

const getCacheKeyForCalculateFees = ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}) =>
  `${account.id}_${account.blockHeight || 0}_${transaction.amount.toString()}_${String(
    transaction.useAllAmount,
  )}_${transaction.recipient}_${
    transaction.feePerByte ? transaction.feePerByte.toString() : ""
  }_${0}_${transaction.utxoStrategy.strategy}_${String(
    transaction.rbf,
  )}_${transaction.utxoStrategy.excludeUTXOs
    .map(({ hash, outputIndex }) => `${hash}@${outputIndex}`)
    .join("+")}_${transaction.replaceTxId || ""}`;

/**
 * An LRU cache whose TTL is resolved from the arguments of each call (e.g. from a coin config):
 * one cache per TTL value, so a remote change of the TTL applies on the next call.
 */
export function makeLRUCacheWithTtlOf<A extends unknown[], T>(
  f: (...args: A) => Promise<T>,
  keyExtractor: (...args: A) => string,
  ttlOf: (...args: A) => number,
): ((...args: A) => Promise<T>) & { reset: () => void } {
  const caches = new Map<number, CacheRes<A, T>>();
  const cacheFor = (ttl: number): CacheRes<A, T> => {
    let cache = caches.get(ttl);
    if (!cache) {
      cache = makeLRUCache(f, keyExtractor, { ttl });
      caches.set(ttl, cache);
    }
    return cache;
  };
  return Object.assign((...args: A) => cacheFor(ttlOf(...args))(...args), {
    reset: () => caches.forEach(cache => cache.reset()),
  });
}

export const calculateFees = makeLRUCacheWithTtlOf(
  async (
    config: BitcoinCoinConfig,
    logger: Logger,
    params: { account: Account; transaction: Transaction },
  ) => getFeesForTransaction(config, logger, params),
  // The built transaction also depends on the explorer it reads pendings and replaced txs from
  // (pendings are not paginated: `batchSize` caps how many conflicting txs an RBF edit sees) and
  // on the RBF bump, so a remote change of any of them must not be served a stale estimate.
  (config, _logger, params) =>
    [
      getCacheKeyForCalculateFees(params),
      config.explorer.url,
      config.explorerId ?? "",
      config.explorer.batchSize ?? DEFAULT_EXPLORER_BATCH_SIZE,
      config.fees?.rbfMinBumpRatio ?? DEFAULT_RBF_MIN_BUMP_RATIO,
    ].join("_"),
  config => config.fees?.calculationCacheTtlMs ?? DEFAULT_FEE_CALCULATION_CACHE_TTL_MS,
);

export const validateRecipient: (
  currency: CryptoCurrency,
  recipient: string | null | undefined,
  changeAddress?: string | undefined,
) => Promise<{
  recipientError: Error | null | undefined;
  recipientWarning: Error | null | undefined;
  changeAddressError: Error | null | undefined;
  changeAddressWarning: Error | null | undefined;
}> = makeLRUCache(
  async (currency, recipient, changeAddress) => {
    if (!recipient) {
      return {
        recipientError: new RecipientRequired(""),
        recipientWarning: null,
        changeAddressError: null,
        changeAddressWarning: null,
      };
    }

    try {
      const recipientWarning = await isValidRecipient({
        currency,
        recipient,
      });
      if (changeAddress) {
        const changeAddressWarning = await isValidRecipient({
          currency,
          recipient: changeAddress,
        });
        return {
          recipientError: null,
          recipientWarning,
          changeAddressError: null,
          changeAddressWarning,
        };
      }
      return {
        recipientError: null,
        recipientWarning,
        changeAddressError: null,
        changeAddressWarning: null,
      };
    } catch (e) {
      return {
        recipientError: e instanceof Error ? e : null,
        recipientWarning: null,
        changeAddressError: null,
        changeAddressWarning: null,
      };
    }
  },
  (currency, recipient, changeAddress) =>
    `${currency.id}_${recipient || ""}_${changeAddress || ""}`,
);

export const isTaprootRecipient: (currency: CryptoCurrency, recipient: string) => Promise<boolean> =
  makeLRUCache(
    async (currency, recipient) => {
      return isTaprootAddress(recipient, <Currency>currency.id);
    },
    (currency, recipient) => `${currency.id}_${recipient || ""}`,
  );
