import { Extrinsics } from "@polkadot/types/metadata/decorate/types";
import { BigNumber } from "bignumber.js";
import { TypeRegistry } from "@polkadot/types";
import { makeLRUCache } from "@ledgerhq/coin-framework/cache";
import type { CacheRes } from "@ledgerhq/coin-framework/cache";
import type { PolkadotAccount, Transaction } from "./types";
import {
  isNewAccount as apiIsNewAccount,
  isControllerAddress as apiIsControllerAddress,
  isElectionClosed as apiIsElectionClosed,
  getRegistry as apiGetRegistry,
  getTransactionParams as apiGetTransactionParams,
  paymentInfo as apiPaymentInfo,
  getMinimumBondBalance as apiGetMinimumBondBalance,
} from "./api";

/**
 * Create a hash for a transaction that is params-specific and stay unchanged if no influcing fees
 *
 * @param {*} a
 * @param {*} t
 *
 * @returns {string} hash
 */
const hashTransactionParams = (
  a: PolkadotAccount,
  t: Transaction,
  signedTx: string
) => {
  // Nonce is added to discard previous estimation when account is synced.
  const prefix = `${a.id}_${a.polkadotResources?.nonce || 0}_${t.mode}`;
  // Fees depends on extrinsic bytesize
  const byteSize = signedTx.length;

  // And on extrinsic weight (which varies with the method called)
  switch (t.mode) {
    case "send":
      return `${prefix}_${byteSize}`;

    case "bond":
      return t.rewardDestination
        ? `${prefix}_${byteSize}_${t.rewardDestination}`
        : `${prefix}_${byteSize}`;

    case "unbond":
    case "rebond":
      return `${prefix}_${byteSize}`;

    case "nominate":
      return `${prefix}_${t.validators?.length ?? "0"}`;

    case "withdrawUnbonded":
      return `${prefix}_${t.numSlashingSpans ?? "0"}`;

    case "chill":
      return `${prefix}`;
    case "setController":
      return `${prefix}`;
    case "claimReward":
      return `${prefix}_${t.era || "0"}`;

    default:
      throw new Error("Unknown mode in transaction");
  }
};

/**
 * Cache the getTransactionInfo for fees estimation to avoid multiple calls during 5 minutes.
 * Should be force refresh when signing operation.
 *
 * @param {Account} account
 *
 * @returns {Promise<Object>} txInfo
 */
export const getTransactionParams: CacheRes<
  Array<void>,
  Record<string, any>
> = makeLRUCache(
  async (): Promise<Record<string, any>> => apiGetTransactionParams(),
  () => "polkadot",
  {
    ttl: 5 * 60 * 1000, // 5 minutes
  }
);

/**
 * Cache the payment info (fee estimate), with a hash depending on fees-changing transaction params and tx size.
 *
 * @param {PolkadotAccount} arg1.a
 * @param {Transaction} arg1.t
 *
 * @returns {Promise<BigBumber>}
 */
export const getPaymentInfo: CacheRes<
  Array<{
    a: PolkadotAccount;
    t: Transaction;
    signedTx: string;
  }>,
  {
    partialFee: string;
  }
> = makeLRUCache(
  async ({
    signedTx,
  }): Promise<{
    partialFee: string;
  }> => {
    return await apiPaymentInfo(signedTx);
  },
  ({ a, t, signedTx }) => hashTransactionParams(a, t, signedTx),
  {
    ttl: 5 * 60 * 1000, // 5 minutes
  }
);
export const getRegistry: CacheRes<
  Array<void>,
  { registry: TypeRegistry; extrinsics: Extrinsics }
> = makeLRUCache(
  async (): Promise<{
    registry: TypeRegistry;
    extrinsics: Extrinsics;
  }> => {
    return await apiGetRegistry();
  },
  () => "polkadot",
  {
    ttl: 60 * 60 * 1000, // 1 hour - could be Infinity
  }
);

/**
 * Cache the isNewAccount to avoid multiple calls get checking tx status.
 *
 * @param {string} address
 *
 * @returns {Promise<boolean>}
 */
export const isNewAccount: CacheRes<Array<string>, boolean> = makeLRUCache(
  async (address): Promise<boolean> => {
    return apiIsNewAccount(address);
  },
  (address) => address,
  {
    ttl: 60 * 1000, // 1 minute
  }
);

/**
 * Cache the isControllerAddress to avoid multiple calls get checking tx status.
 *
 * @param {string} address
 *
 * @returns {Promise<boolean>}
 */
export const isControllerAddress: CacheRes<
  Array<string>,
  boolean
> = makeLRUCache(
  async (address): Promise<boolean> => {
    return apiIsControllerAddress(address);
  },
  (address) => address,
  {
    ttl: 5 * 60 * 1000, // 5 minutes
  }
);

/**
 * Cache the isElectionClosed to avoid multiple calls get checking tx status.
 * Should be unused if currency is preloaded.
 *
 * @returns {Promise<boolean>}
 */
export const isElectionClosed: CacheRes<Array<void>, boolean> = makeLRUCache(
  async (): Promise<boolean> => {
    return apiIsElectionClosed();
  },
  () => "",
  {
    ttl: 60 * 1000, // 1 minute
  }
);

/**
 * Cache the getMinimumBondBalance to avoid too many calls
 *
 * @async
 *
 * @returns {Promise<BigNumber>} consts
 */
export const getMinimumBondBalance: CacheRes<
  Array<void>,
  BigNumber
> = makeLRUCache(
  async (): Promise<BigNumber> => apiGetMinimumBondBalance(),
  () => "polkadot",
  {
    max: 1, // Store only one object since we only have polkadot.
    ttl: 60 * 60 * 1000, // 1 hour
  }
);
