import { makeLRUCache, minutes, hours } from "@ledgerhq/live-network/cache";
import { getOperations as bisonGetOperations } from "./bisontrails";
import {
  getAccount as sidecardGetAccount,
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
} from "./sidecar";
import { SidecarPaymentInfo } from "./sidecar.types";
import BigNumber from "bignumber.js";
import { PolkadotAccount, PolkadotNomination, PolkadotUnlocking, Transaction } from "../types";
import { TypeRegistry } from "@polkadot/types";
import { Extrinsics } from "@polkadot/types/metadata/decorate/types";

type PaymentInfoParams = {
  a: PolkadotAccount;
  t: Transaction;
  signedTx: string;
};
type Registry = {
  registry: TypeRegistry;
  extrinsics: Extrinsics;
};
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

type CacheOpts = {
  force: boolean;
};

const getTransactionParamsFn = makeLRUCache(
  sidecarGetTransactionParams,
  () => "polkadot",
  minutes(5),
);

export default {
  getAccount: async (address: string): Promise<PolkadotAPIAccount> => sidecardGetAccount(address),

  getOperations: bisonGetOperations,

  getMinimumBondBalance: async (): Promise<BigNumber> =>
    makeLRUCache(sidecarGetMinimumBondBalance, () => "polkadot", hours(1, 1))(),

  getRegistry: async (): Promise<Registry> =>
    makeLRUCache(sidecarGetRegistry, () => "polkadot", hours(1))(),

  getStakingProgress: sidecarGetStakingProgress,

  getValidators: sidecarGetValidators,

  getTransactionParams: async (
    { force }: CacheOpts = { force: false },
  ): Promise<Record<string, any>> => {
    return force ? getTransactionParamsFn.force() : getTransactionParamsFn();
  },

  getPaymentInfo: async (
    data: PaymentInfoParams,
  ): Promise<Pick<SidecarPaymentInfo, "partialFee">> =>
    makeLRUCache(
      async ({
        signedTx,
      }): Promise<{
        partialFee: string;
      }> => sidecarPaymentInfo(signedTx),
      ({ a, t, signedTx }) => hashTransactionParams(a, t, signedTx),
      minutes(5),
    )(data),

  isControllerAddress: makeLRUCache(sidecarIsControllerAddress, address => address, minutes(5)),

  isElectionClosed: async (): Promise<boolean> =>
    makeLRUCache(sidecarIsElectionClosed, () => "", minutes(1))(),

  isNewAccount: async (address: string): Promise<boolean> =>
    makeLRUCache(sidecarIsNewAccount, address => address, minutes(1))(address),

  submitExtrinsic: async (extrinsic: string) => sidecarSubmitExtrinsic(extrinsic),

  verifyValidatorAddresses: async (validators: string[]): Promise<string[]> =>
    sidecarVerifyValidatorAddresses(validators),
};

/**
 * Create a hash for a transaction that is params-specific and stay unchanged if no influcing fees
 *
 * @param {*} a
 * @param {*} t
 *
 * @returns {string} hash
 */
const hashTransactionParams = (a: PolkadotAccount, t: Transaction, signedTx: string) => {
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
