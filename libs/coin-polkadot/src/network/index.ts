import { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
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
import type { CacheRes, LRUCacheFn } from "@ledgerhq/coin-framework/cache";
import {
  SidecarPaymentInfo,
  SidecarValidatorsParamAddresses,
  SidecarValidatorsParamStatus,
} from "./sidecar.types";
import BigNumber from "bignumber.js";
import {
  PolkadotAccount,
  PolkadotNomination,
  PolkadotOperation,
  PolkadotStakingProgress,
  PolkadotUnlocking,
  PolkadotValidator,
  Transaction,
} from "../types";
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

export class PolkadotAPI {
  network: NetworkRequestCall;
  cache: LRUCacheFn;

  private getMinimumBondBalanceFn: CacheRes<Array<void>, BigNumber> | undefined;
  private getRegistryFn: CacheRes<Array<void>, Registry> | undefined;
  private getTransactionParamsFn: CacheRes<Array<void>, Record<string, any>> | undefined;
  private isControllerAddressFn: CacheRes<Array<string>, boolean> | undefined;
  private isElectionClosedFn: CacheRes<Array<void>, boolean> | undefined;
  private isNewAccountFn: CacheRes<Array<string>, boolean> | undefined;
  private paymentInfoFn:
    | CacheRes<Array<PaymentInfoParams>, Pick<SidecarPaymentInfo, "partialFee">>
    | undefined;

  constructor(network: NetworkRequestCall, cache: LRUCacheFn) {
    this.network = network;
    this.cache = cache;
  }

  async getAccount(address: string): Promise<PolkadotAPIAccount> {
    return sidecardGetAccount(this.network, this.cache)(address);
  }

  async getOperations(accountId: string, addr: string, startA = 0): Promise<PolkadotOperation[]> {
    return bisonGetOperations(this.network)(accountId, addr, startA);
  }

  async getMinimumBondBalance(): Promise<BigNumber> {
    if (this.getMinimumBondBalanceFn !== undefined) return this.getMinimumBondBalanceFn();

    this.getMinimumBondBalanceFn = this.cache(
      async (): Promise<BigNumber> => sidecarGetMinimumBondBalance(this.network)(),
      () => "polkadot",
      {
        max: 1, // Store only one object since we only have polkadot.
        ttl: 60 * 60 * 1000, // 1 hour
      },
    );

    return this.getMinimumBondBalanceFn();
  }

  async getRegistry(): Promise<Registry> {
    if (this.getRegistryFn !== undefined) return this.getRegistryFn();

    this.getRegistryFn = this.cache(
      async (): Promise<Registry> => {
        return await sidecarGetRegistry(this.network, this.cache)();
      },
      () => "polkadot",
      {
        ttl: 60 * 60 * 1000, // 1 hour - could be Infinity
      },
    );

    return this.getRegistryFn();
  }

  async getStakingProgress(): Promise<PolkadotStakingProgress> {
    return sidecarGetStakingProgress(this.network, this.cache)();
  }

  async getValidators(
    stashes: SidecarValidatorsParamStatus | SidecarValidatorsParamAddresses = "elected",
  ): Promise<PolkadotValidator[]> {
    return sidecarGetValidators(this.network)(stashes);
  }

  async getTransactionParams(
    { force }: CacheOpts = { force: false },
  ): Promise<Record<string, any>> {
    if (this.getTransactionParamsFn !== undefined) {
      return force ? this.getTransactionParamsFn.force() : this.getTransactionParamsFn();
    }

    this.getTransactionParamsFn = this.cache(
      async (): Promise<Record<string, any>> => sidecarGetTransactionParams(this.network)(),
      () => "polkadot",
      {
        ttl: 5 * 60 * 1000, // 5 minutes
      },
    );

    return this.getTransactionParamsFn();
  }

  async getPaymentInfo(data: PaymentInfoParams): Promise<Pick<SidecarPaymentInfo, "partialFee">> {
    if (this.paymentInfoFn !== undefined) return this.paymentInfoFn(data);

    this.paymentInfoFn = this.cache(
      async ({
        signedTx,
      }): Promise<{
        partialFee: string;
      }> => {
        return sidecarPaymentInfo(this.network)(signedTx);
      },
      ({ a, t, signedTx }) => hashTransactionParams(a, t, signedTx),
      {
        ttl: 5 * 60 * 1000, // 5 minutes
      },
    );

    return this.paymentInfoFn(data);
  }

  async isControllerAddress(address: string): Promise<boolean> {
    if (this.isControllerAddressFn !== undefined) return this.isControllerAddressFn(address);

    this.isControllerAddressFn = this.cache(
      async (address): Promise<boolean> => sidecarIsControllerAddress(this.network)(address),
      address => address,
      {
        ttl: 5 * 60 * 1000, // 5 minutes
      },
    );

    return this.isControllerAddressFn(address);
  }

  async isElectionClosed(): Promise<boolean> {
    if (this.isElectionClosedFn !== undefined) return this.isElectionClosedFn();

    this.isElectionClosedFn = this.cache(
      async (): Promise<boolean> => sidecarIsElectionClosed(this.network)(),
      () => "",
      {
        ttl: 60 * 1000, // 1 minute
      },
    );

    return this.isElectionClosedFn();
  }

  async isNewAccount(address: string): Promise<boolean> {
    if (this.isNewAccountFn !== undefined) return this.isNewAccountFn(address);

    this.isNewAccountFn = this.cache(
      async (address): Promise<boolean> => sidecarIsNewAccount(this.network)(address),
      address => address,
      {
        ttl: 60 * 1000, // 1 minute
      },
    );

    return this.isNewAccountFn(address);
  }

  async submitExtrinsic(extrinsic: string) {
    return sidecarSubmitExtrinsic(this.network)(extrinsic);
  }

  async verifyValidatorAddresses(validators: string[]): Promise<string[]> {
    return sidecarVerifyValidatorAddresses(this.network)(validators);
  }
}

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
