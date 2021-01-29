// @flow
import { BigNumber } from "bignumber.js";
import { TypeRegistry, ModulesWithCalls } from "@polkadot/types";

import { makeLRUCache } from "../../cache";
import type { CacheRes } from "../../cache";
import type { Account } from "../../types";
import type { Transaction } from "./types";

import {
  isNewAccount as apiIsNewAccount,
  isControllerAddress as apiIsControllerAddress,
  isElectionClosed as apiIsElectionClosed,
  getRegistry as apiGetRegistry,
  getTransactionParams as apiGetTransactionParams,
} from "./api";
import getEstimatedFees from "./js-getFeesForTransaction";

/**
 * Create a hash for a transaction that is params-specific and stay unchanged if no influcing fees
 *
 * @param {*} a
 * @param {*} t
 *
 * @returns {string} hash
 */
const hashTransactionParams = (a: Account, t: Transaction) => {
  // Note this is highly linked to getEstimatedFees, which recalculate automatically the amount when useAllAmount
  // Nonce is added to discard previous estimation when account is synced.
  const prefix = `${a.id}_${a.polkadotResources?.nonce || 0}_${t.mode}`;
  const amount = t.useAllAmount ? "MAX" : t.amount.toString();

  switch (t.mode) {
    case "send":
      return `${prefix}_${amount}`;
    case "bond":
      return t.rewardDestination
        ? `${prefix}_${amount}_${t.rewardDestination}`
        : `${prefix}_${amount}`;
    case "unbond":
    case "rebond":
      return `${prefix}_${amount}`;
    case "nominate":
      return `${prefix}_${t.validators?.length ?? "0"}`;
    case "withdrawUnbonded":
      return `${prefix}_${t.numSlashingSpans ?? "0"}`;
    case "chill":
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
export const getTransactionParams: CacheRes<Array<void>, Object> = makeLRUCache(
  async (): Promise<Object> => apiGetTransactionParams(),
  () => "polkadot",
  {
    maxAge: 5 * 60 * 1000, // 5 minutes
  }
);

/**
 * Cache the fees estimation, with a hash deending on fees-changing transaction params only.
 *
 * @param {Account} arg1.a
 * @param {Transaction} arg1.t
 *
 * @returns {Promise<BigBumber>}
 */
export const getFees: CacheRes<
  Array<{ a: Account, t: Transaction }>,
  BigNumber
> = makeLRUCache(
  async ({ a, t }): Promise<BigNumber> => {
    return await getEstimatedFees(a, t);
  },
  ({ a, t }) => hashTransactionParams(a, t),
  {
    maxAge: 5 * 60 * 1000, // 5 minutes
  }
);

export const getRegistry: CacheRes<Array<void>, Object> = makeLRUCache(
  async (): Promise<{
    registry: typeof TypeRegistry,
    extrinsics: typeof ModulesWithCalls,
  }> => {
    return await apiGetRegistry();
  },
  () => "polkadot",
  {
    maxAge: 60 * 60 * 1000, // 1 hour - could be Infinity
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
    maxAge: 60 * 1000, // 1 minute
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
    maxAge: 5 * 60 * 1000, // 5 minutes
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
    maxAge: 60 * 1000, // 1 minute
  }
);
