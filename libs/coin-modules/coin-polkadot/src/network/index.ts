import { makeLRUCache, minutes, hours } from "@ledgerhq/live-network/cache";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import { type PolkadotCoinConfig } from "../config";
import { PolkadotAccount, PolkadotNomination, PolkadotUnlocking, Transaction } from "../types";
import { getOperations as bisonGetOperations } from "./bisontrails";
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

const getMinimumBondBalance = makeLRUCache(
  (config: PolkadotCoinConfig, currency: CryptoCurrency | undefined) =>
    sidecarGetMinimumBondBalance(config, currency),
  (_config, currency: CryptoCurrency | undefined) => currency?.id || "polkadot",
  hours(1, 1),
);
const getRegistry = makeLRUCache(
  (config: PolkadotCoinConfig, currency: CryptoCurrency | undefined) =>
    sidecarGetRegistry(config, currency),
  (_config, currency: CryptoCurrency | undefined) => currency?.id || "polkadot",
  hours(1),
);

const getTransactionParamsFn = makeLRUCache(
  (config: PolkadotCoinConfig, currency: CryptoCurrency | undefined) =>
    sidecarGetTransactionParams(config, currency),
  (_config, currency: CryptoCurrency | undefined) => currency?.id || "polkadot",
  minutes(5),
);
const getPaymentInfo = makeLRUCache(
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
  minutes(5),
);
const paymentInfo = makeLRUCache(
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
  minutes(5),
);

const isControllerAddress = makeLRUCache(
  (config: PolkadotCoinConfig, address: string, currency: CryptoCurrency | undefined) =>
    sidecarIsControllerAddress(config, address, currency),
  (_config, address) => address,
  minutes(5),
);
const isElectionClosed = makeLRUCache(
  (config: PolkadotCoinConfig, currency: CryptoCurrency) =>
    sidecarIsElectionClosed(config, currency),
  () => "",
  minutes(1),
);

const isNewAccount = makeLRUCache(
  (config: PolkadotCoinConfig, addr: string, currency: CryptoCurrency | undefined) =>
    sidecarIsNewAccount(config, addr, currency),
  (_config, addr) => addr,
  minutes(1),
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
    config: PolkadotCoinConfig,
    address: string,
    currency: CryptoCurrency,
  ): Promise<PolkadotAPIAccount> => sidecardGetAccount(config, address, currency),
  getBalances: async (
    config: PolkadotCoinConfig,
    address: string,
    currency?: CryptoCurrency,
  ): Promise<PolkadotAPIBalanceInfo> => sidecardGetBalances(config, address, currency),
  getOperations: bisonGetOperations,
  getLastBlock,
  getMinimumBondBalance,
  getRegistry,
  getStakingProgress: sidecarGetStakingProgress,
  getValidators: sidecarGetValidators,
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
  verifyValidatorAddresses: async (
    validators: string[],
    currency?: CryptoCurrency,
  ): Promise<string[]> => sidecarVerifyValidatorAddresses(validators, currency),
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
