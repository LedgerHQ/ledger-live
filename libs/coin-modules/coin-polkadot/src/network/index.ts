import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import { type PolkadotCoinConfig } from "../config";
import {
  DEFAULT_CONTROLLER_CACHE_TTL_MS,
  DEFAULT_ELECTION_STATUS_CACHE_TTL_MS,
  DEFAULT_FEE_ESTIMATE_CACHE_TTL_MS,
  DEFAULT_MINIMUM_BOND_CACHE_TTL_MS,
  DEFAULT_NEW_ACCOUNT_CACHE_TTL_MS,
  DEFAULT_REGISTRY_CACHE_TTL_MS,
  DEFAULT_STAKING_PROGRESS_CACHE_TTL_MS,
  DEFAULT_TRANSACTION_PARAMS_CACHE_TTL_MS,
  DEFAULT_VALIDATORS_ADDRESSES_CACHE_TTL_MS,
  DEFAULT_VALIDATORS_CACHE_TTL_MS,
} from "../constants";
import {
  PolkadotAccount,
  PolkadotNomination,
  PolkadotStakingProgress,
  PolkadotUnlocking,
  PolkadotValidator,
  Transaction,
} from "../types";
import { getOperations as bisonGetOperations } from "./bisontrails";
import { makeConfigurableLRUCache } from "./cache";
import {
  getAccount as sidecardGetAccount,
  getBalances as sidecardGetBalances,
  getMinimumBondBalance as sidecarGetMinimumBondBalance,
  getRegistry as sidecarGetRegistry,
  getStakingProgress as sidecarGetStakingProgress,
  getTransactionParams as sidecarGetTransactionParams,
  getValidators as sidecarGetValidators,
  isNewAccount as sidecarIsNewAccount,
  isControllerAddress as sidecarIsControllerAddress,
  isElectionClosed as sidecarIsElectionClosed,
  paymentInfo as sidecarPaymentInfo,
  submitExtrinsic as sidecarSubmitExtrinsic,
  submitExtrinsicDryRun as sidecarSubmitExtrinsicDryRun,
  verifyValidatorAddresses as sidecarVerifyValidatorAddresses,
  getMetadata as sidecarGetMetadata,
  getLastBlock,
} from "./sidecar";

type PolkadotAPIAccount = {
  blockHeight: number;
  balance: BigNumber;
  spendableBalance: BigNumber;
  nonce: number;
  lockedBalance: BigNumber;

  controller: string | null;
  stash: string | null;
  unlockedBalance: BigNumber;
  unlockingBalance: BigNumber;
  unlockings: PolkadotUnlocking[];
  numSlashingSpans?: number;

  nominations: PolkadotNomination[];
};

type PolkadotAPIBalanceInfo = {
  blockHeight: number;
  balance: BigNumber;
  spendableBalance: BigNumber;
  nonce: number;
  lockedBalance: BigNumber;
};

type CacheOpts = {
  force: boolean;
};

const getMinimumBondBalance = makeConfigurableLRUCache(
  (config: PolkadotCoinConfig, currency: CryptoCurrency | undefined) =>
    sidecarGetMinimumBondBalance(config, currency),
  (_config, currency: CryptoCurrency | undefined) => currency?.id || "polkadot",
  config => config.sidecar.minimumBondCacheTtlMs ?? DEFAULT_MINIMUM_BOND_CACHE_TTL_MS,
  1,
);
const getStakingProgress = makeConfigurableLRUCache(
  (logger: Logger, config: PolkadotCoinConfig, currency: CryptoCurrency) =>
    sidecarGetStakingProgress(logger, config, currency),
  (_logger, _config, currency: CryptoCurrency) => currency.id,
  (_logger, config) =>
    config.sidecar.stakingProgressCacheTtlMs ?? DEFAULT_STAKING_PROGRESS_CACHE_TTL_MS,
);
const getValidators = makeConfigurableLRUCache(
  (
    config: PolkadotCoinConfig,
    stashes: Parameters<typeof sidecarGetValidators>[1],
    _currency: CryptoCurrency | undefined,
  ) => sidecarGetValidators(config, stashes),
  (_config, stashes, currency) => {
    // sidecarGetValidators defaults undefined to "elected"; normalize + make the
    // array case order-independent so equivalent inputs share a cache entry.
    const normalized = stashes === undefined ? "elected" : stashes;
    const stashesKey = Array.isArray(normalized)
      ? [...normalized].sort().join(",")
      : String(normalized);
    return `${currency?.id || "polkadot"}_${stashesKey}`;
  },
  config => config.validators?.cacheTtlMs ?? DEFAULT_VALIDATORS_CACHE_TTL_MS,
);

/**
 * Seed the on-demand caches with deterministic data (used by the mock bridge in
 * tests). Mirrors the coin-tron `hydrateSuperRepresentatives` pattern: hydration
 * is folded into the LRU caches rather than a global store.
 */
export const hydrateValidators = (validators: PolkadotValidator[], currency?: CryptoCurrency) => {
  getValidators.hydrate(`${currency?.id || "polkadot"}_all`, validators);
};
export const hydrateStakingProgress = (
  staking: PolkadotStakingProgress,
  currency?: CryptoCurrency,
) => {
  getStakingProgress.hydrate(currency?.id || "polkadot", staking);
};
export const hydrateMinimumBondBalance = (
  minimumBondBalance: BigNumber,
  currency?: CryptoCurrency,
) => {
  getMinimumBondBalance.hydrate(currency?.id || "polkadot", minimumBondBalance);
};
const getRegistry = makeConfigurableLRUCache(
  (config: PolkadotCoinConfig, currency: CryptoCurrency | undefined) =>
    sidecarGetRegistry(config, currency),
  (_config, currency: CryptoCurrency | undefined) => currency?.id || "polkadot",
  config => config.sidecar.registryCacheTtlMs ?? DEFAULT_REGISTRY_CACHE_TTL_MS,
);

const getTransactionParamsFn = makeConfigurableLRUCache(
  (config: PolkadotCoinConfig, currency: CryptoCurrency | undefined) =>
    sidecarGetTransactionParams(config, currency),
  (_config, currency: CryptoCurrency | undefined) => currency?.id || "polkadot",
  config => config.sidecar.transactionParamsCacheTtlMs ?? DEFAULT_TRANSACTION_PARAMS_CACHE_TTL_MS,
);
const getPaymentInfo = makeConfigurableLRUCache(
  async (
    config: PolkadotCoinConfig,
    { signedTx },
    currency: CryptoCurrency | undefined,
  ): Promise<{
    partialFee: string;
  }> => {
    return sidecarPaymentInfo(config, signedTx, currency);
  },
  (_config, { a, t, signedTx }) => hashTransactionParams(a, t, signedTx),
  config => config.sidecar.feeEstimateCacheTtlMs ?? DEFAULT_FEE_ESTIMATE_CACHE_TTL_MS,
);
const paymentInfo = makeConfigurableLRUCache(
  async (
    config: PolkadotCoinConfig,
    signedTx: string,
    currency: CryptoCurrency | undefined,
  ): Promise<{
    partialFee: string;
  }> => {
    return sidecarPaymentInfo(config, signedTx, currency);
  },
  (_config, signedTx) => signedTx,
  config => config.sidecar.feeEstimateCacheTtlMs ?? DEFAULT_FEE_ESTIMATE_CACHE_TTL_MS,
);

const isControllerAddress = makeConfigurableLRUCache(
  (config: PolkadotCoinConfig, address: string, currency: CryptoCurrency | undefined) =>
    sidecarIsControllerAddress(config, address, currency),
  (_config, address) => address,
  config => config.sidecar.controllerCacheTtlMs ?? DEFAULT_CONTROLLER_CACHE_TTL_MS,
);
const isElectionClosed = makeConfigurableLRUCache(
  (config: PolkadotCoinConfig, currency: CryptoCurrency) =>
    sidecarIsElectionClosed(config, currency),
  () => "",
  config => config.sidecar.electionStatusCacheTtlMs ?? DEFAULT_ELECTION_STATUS_CACHE_TTL_MS,
);

const verifyValidatorAddresses = makeConfigurableLRUCache(
  (config: PolkadotCoinConfig, validators: string[], _currency: CryptoCurrency | undefined) =>
    sidecarVerifyValidatorAddresses(config, validators),
  (_config, validators, currency) =>
    `${currency?.id || "polkadot"}_${[...validators].sort().join(",")}`,
  config => config.validators?.addressesCacheTtlMs ?? DEFAULT_VALIDATORS_ADDRESSES_CACHE_TTL_MS,
);
const isNewAccount = makeConfigurableLRUCache(
  (config: PolkadotCoinConfig, addr: string, currency: CryptoCurrency | undefined) =>
    sidecarIsNewAccount(config, addr, currency),
  (_config, addr) => addr,
  config => config.sidecar.newAccountCacheTtlMs ?? DEFAULT_NEW_ACCOUNT_CACHE_TTL_MS,
);

const getMetadata = async (
  config: PolkadotCoinConfig,
  callData: string,
  includedInExtrinsic: string,
  includedInSignedData: string,
  currency?: CryptoCurrency,
): Promise<{ metadataBlob: string; metadataHash: string }> => {
  return sidecarGetMetadata(config, callData, includedInExtrinsic, includedInSignedData, currency);
};

export default {
  getAccount: async (
    logger: Logger,
    config: PolkadotCoinConfig,
    address: string,
    currency: CryptoCurrency,
  ): Promise<PolkadotAPIAccount> => sidecardGetAccount(logger, config, address, currency),
  getBalances: async (
    config: PolkadotCoinConfig,
    address: string,
    currency?: CryptoCurrency,
  ): Promise<PolkadotAPIBalanceInfo> => sidecardGetBalances(config, address, currency),
  getOperations: bisonGetOperations,
  getLastBlock,
  getMinimumBondBalance,
  getRegistry,
  getStakingProgress,
  getValidators,
  getTransactionParams: async (
    config: PolkadotCoinConfig,
    currency?: CryptoCurrency,
    { force }: CacheOpts = { force: false },
  ) => {
    return force
      ? getTransactionParamsFn.force(config, currency)
      : getTransactionParamsFn(config, currency);
  },
  getPaymentInfo,
  paymentInfo,
  isControllerAddress,
  isElectionClosed,
  isNewAccount,
  getMetadata,
  submitExtrinsic: async (
    config: PolkadotCoinConfig,
    extrinsic: string,
    currency?: CryptoCurrency,
  ) => sidecarSubmitExtrinsic(config, extrinsic, currency),
  verifyValidatorAddresses,
  submitExtrinsicDryRun: async (
    config: PolkadotCoinConfig,
    extrinsic: string,
    currency?: CryptoCurrency,
  ) => sidecarSubmitExtrinsicDryRun(config, extrinsic, currency),
};

/**
 * Create a hash for a transaction that is params-specific and stay unchanged if no influcing fees
 *
 * @param {*} a
 * @param {*} t
 *
 * @returns {string} hash
 */
const hashTransactionParams = (
  { id, polkadotResources }: PolkadotAccount,
  { mode, rewardDestination, validators, numSlashingSpans, era }: Transaction,
  signedTx: string,
) => {
  // Nonce is added to discard previous estimation when account is synced.
  const prefix = `${id}_${polkadotResources?.nonce || 0}_${mode}`;
  // Fees depends on extrinsic bytesize
  const byteSize = signedTx.length;

  // And on extrinsic weight (which varies with the method called)
  switch (mode) {
    case "send":
      return `${prefix}_${byteSize}`;

    case "bond":
      return rewardDestination
        ? `${prefix}_${byteSize}_${rewardDestination}`
        : `${prefix}_${byteSize}`;

    case "unbond":
    case "rebond":
      return `${prefix}_${byteSize}`;

    case "nominate":
      return `${prefix}_${validators?.length ?? "0"}`;

    case "withdrawUnbonded":
      return `${prefix}_${numSlashingSpans ?? "0"}`;

    case "chill":
      return `${prefix}`;
    case "setController":
      return `${prefix}`;
    case "claimReward":
      return `${prefix}_${era || "0"}`;

    default:
      throw new Error("Unknown mode in transaction");
  }
};
