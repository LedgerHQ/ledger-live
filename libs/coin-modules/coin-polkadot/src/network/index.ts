import { makeLRUCache, minutes, hours } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
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
  verifyValidatorAddresses as sidecarVerifyValidatorAddresses,
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
  (currency: CryptoCurrency | undefined) => sidecarGetMinimumBondBalance(currency),
  (currency: CryptoCurrency | undefined) => currency?.id || "polkadot",
  hours(1, 1),
);
const getRegistry = makeLRUCache(
  (currency: CryptoCurrency | undefined) => sidecarGetRegistry(currency),
  (currency: CryptoCurrency | undefined) => currency?.id || "polkadot",
  hours(1),
);

const getTransactionParamsFn = makeLRUCache(
  (currency: CryptoCurrency | undefined) => sidecarGetTransactionParams(currency),
  (currency: CryptoCurrency | undefined) => currency?.id || "polkadot",
  minutes(5),
);
const getPaymentInfo = makeLRUCache(
  async (
    { signedTx },
    currency: CryptoCurrency | undefined,
  ): Promise<{
    partialFee: string;
  }> => {
    return sidecarPaymentInfo(signedTx, currency);
  },
  ({ a, t, signedTx }) => hashTransactionParams(a, t, signedTx),
  minutes(5),
);
const paymentInfo = makeLRUCache(
  async (
    signedTx: string,
    currency: CryptoCurrency | undefined,
  ): Promise<{
    partialFee: string;
  }> => {
    return sidecarPaymentInfo(signedTx, currency);
  },
  signedTx => signedTx,
  minutes(5),
);

const isControllerAddress = makeLRUCache(
  (address: string, currency: CryptoCurrency | undefined) =>
    sidecarIsControllerAddress(address, currency),
  address => address,
  minutes(5),
);
const isElectionClosed = makeLRUCache(
  (currency: CryptoCurrency) => sidecarIsElectionClosed(currency),
  () => "",
  minutes(1),
);

const isNewAccount = makeLRUCache(
  (addr: string, currency: CryptoCurrency | undefined) => sidecarIsNewAccount(addr, currency),
  address => address,
  minutes(1),
);

const metadataHash = async (currency?: CryptoCurrency): Promise<string> => {
  const id = coinConfig.getCoinConfig(currency).metadataShortener.id;
  const res: any = await network({
    method: "POST",
    url: coinConfig.getCoinConfig(currency).metadataHash.url,
    data: {
      id: id,
    },
  });
  return res.data.metadataHash;
};

const shortenMetadata = async (transaction: string, currency?: CryptoCurrency): Promise<string> => {
  const id = coinConfig.getCoinConfig(currency).metadataShortener.id;
  const res: any = await network({
    method: "POST",
    url: coinConfig.getCoinConfig(currency).metadataShortener.url,
    data: {
      chain: {
        id: id,
      },
      txBlob: transaction,
    },
  });

  return res.data.txMetadata;
};

export default {
  getAccount: async (address: string, currency: CryptoCurrency): Promise<PolkadotAPIAccount> =>
    sidecardGetAccount(address, currency),
  getBalances: async (
    address: string,
    currency?: CryptoCurrency,
  ): Promise<PolkadotAPIBalanceInfo> => sidecardGetBalances(address, currency),
  getOperations: bisonGetOperations,
  getLastBlock,
  getMinimumBondBalance,
  getRegistry,
  getStakingProgress: sidecarGetStakingProgress,
  getValidators: sidecarGetValidators,
  getTransactionParams: async (
    currency?: CryptoCurrency,
    { force }: CacheOpts = { force: false },
  ) => {
    return force ? getTransactionParamsFn.force(currency) : getTransactionParamsFn(currency);
  },
  getPaymentInfo,
  paymentInfo,
  isControllerAddress,
  isElectionClosed,
  isNewAccount,
  metadataHash,
  shortenMetadata,
  submitExtrinsic: async (extrinsic: string, currency?: CryptoCurrency) =>
    sidecarSubmitExtrinsic(extrinsic, currency),
  verifyValidatorAddresses: async (
    validators: string[],
    currency?: CryptoCurrency,
  ): Promise<string[]> => sidecarVerifyValidatorAddresses(validators, currency),
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
