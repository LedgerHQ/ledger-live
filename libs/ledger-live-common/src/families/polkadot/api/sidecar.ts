import { BigNumber } from "bignumber.js";
import querystring from "querystring";
import { TypeRegistry } from "@polkadot/types";
import { getSpecTypes } from "@polkadot/types-known";
import { Metadata } from "@polkadot/types/metadata";
import { expandMetadata } from "@polkadot/types/metadata/decorate";
import { Extrinsics } from "@polkadot/types/metadata/decorate/types";
import { makeLRUCache } from "../../../cache";
import type { CacheRes } from "../../../cache";
import { getEnv } from "../../../env";
import network from "../../../network";
import type {
  PolkadotValidator,
  PolkadotStakingProgress,
  PolkadotUnlocking,
  PolkadotNomination,
} from "../types";
import type {
  SidecarAccountBalanceInfo,
  SidecarPalletStorageItem,
  SidecarStakingInfo,
  SidecarNominations,
  SidecarConstants,
  SidecarValidatorsParamStatus,
  SidecarValidatorsParamAddresses,
  SidecarValidators,
  SidecarPalletStakingProgress,
  SidecarTransactionMaterial,
  SidecarTransactionBroadcast,
  SidecarPaymentInfo,
  SidecarRuntimeSpec,
} from "./sidecar.types";

/**
 * Get indexer base url.
 *
 * @returns {string}
 */
const getBaseSidecarUrl = (): string => getEnv("API_POLKADOT_SIDECAR");

/**
 * Returns the full indexer url for en route endpoint.
 *
 * @param {*} route
 *
 * @returns {string}
 */
const getSidecarUrl = (route): string => `${getBaseSidecarUrl()}${route || ""}`;

const VALIDATOR_COMISSION_RATIO = 1000000000;
const ELECTION_STATUS_OPTIMISTIC_THRESHOLD =
  getEnv("POLKADOT_ELECTION_STATUS_THRESHOLD") || 25;

// blocks = 2 minutes 30

/**
 * Fetch Balance from the api.
 *
 * @async
 * @param {string} addr
 *
 * @returns {SidecarAccountBalanceInfo}
 */
const fetchBalanceInfo = async (
  addr: string
): Promise<SidecarAccountBalanceInfo> => {
  const {
    data,
  }: {
    data: SidecarAccountBalanceInfo;
  } = await network({
    method: "GET",
    url: getSidecarUrl(`/accounts/${addr}/balance-info`),
  });
  return data;
};

/**
 * Fetch the stash address associated to an account.
 *
 * @async
 * @param {string} addr
 *
 * @returns {string}
 */
const fetchStashAddr = async (addr: string): Promise<string | null> => {
  const {
    data,
  }: {
    data: SidecarPalletStorageItem;
  } = await network({
    method: "GET",
    url: getSidecarUrl(
      `/pallets/staking/storage/ledger?keys[]=${addr}&key1=${addr}`
    ),
  });
  return data.value?.stash ?? null;
};

/**
 * Fetch the controller address associated to an account.
 *
 * @async
 * @param {string} addr
 *
 * @returns {string}
 */
const fetchControllerAddr = async (addr: string): Promise<string | null> => {
  const {
    data,
  }: {
    data: SidecarPalletStorageItem;
  } = await network({
    method: "GET",
    url: getSidecarUrl(
      `/pallets/staking/storage/bonded?keys[]=${addr}&key1=${addr}`
    ),
  });
  return data.value ?? null;
};

/**
 * Fetch the staking info for an account.
 *
 * @async
 * @param {string} addr
 *
 * @returns {SidecarStakingInfo}
 */
const fetchStakingInfo = async (addr: string): Promise<SidecarStakingInfo> => {
  const {
    data,
  }: {
    data: SidecarStakingInfo;
  } = await network({
    method: "GET",
    url: getSidecarUrl(`/accounts/${addr}/staking-info`),
  });
  return data;
};

/**
 * Returns the list of nominations for an account, with status and associated stake if relevant.
 *
 * @async
 * @param {string} addr
 *
 * @returns {SidecarNominations}
 */
const fetchNominations = async (addr: string): Promise<SidecarNominations> => {
  const {
    data,
  }: {
    data: SidecarNominations;
  } = await network({
    method: "GET",
    url: getSidecarUrl(`/accounts/${addr}/nominations`),
  });
  return data;
};

/**
 * Returns the blockchain's runtime constants.
 *
 * @async
 * @param {string} addr
 *
 * @returns {Object}
 */
const fetchConstants = async (): Promise<Record<string, any>> => {
  const {
    data,
  }: {
    data: SidecarConstants;
  } = await network({
    method: "GET",
    url: getSidecarUrl(`/runtime/constants`),
  });
  return data.consts;
};

/**
 * Returns the activeEra info
 *
 * @async
 *
 * @returns {SidecarPalletStorageItem}
 */
const fetchActiveEra = async (): Promise<SidecarPalletStorageItem> => {
  const {
    data,
  }: {
    data: SidecarPalletStorageItem;
  } = await network({
    method: "GET",
    url: getSidecarUrl("/pallets/staking/storage/activeEra"),
  });
  return data;
};

/**
 * Fetch the minimum value allowed for a bond
 *
 * @async
 * @param {string} addr
 *
 * @returns {string}
 */
export const getMinimumBondBalance = async (): Promise<BigNumber> => {
  const { data }: { data: SidecarPalletStorageItem } = await network({
    method: "GET",
    url: getSidecarUrl(`/pallets/staking/storage/minNominatorBond`),
  });

  return (data.value && new BigNumber(data.value)) || new BigNumber(0);
};

/**
 * Fetch a list of validators with some info and indentity.
 * It fetches the list providing a status (all, elected, waiting) and/or a list of
 * addresses (comma-separated or as multiple query params).
 *
 * @async
 * @param {string} status
 * @param {string[]} addresses
 *
 * @returns {SidecarValidators}
 */
const fetchValidators = async (
  status: SidecarValidatorsParamStatus = "all",
  addresses?: SidecarValidatorsParamAddresses
): Promise<SidecarValidators> => {
  let params = {};

  if (status) {
    params = { ...params, status };
  }

  if (addresses && addresses.length) {
    params = { ...params, addresses: addresses.join(",") };
  }

  const {
    data,
  }: {
    data: SidecarValidators;
  } = await network({
    method: "GET",
    url: getSidecarUrl(`/validators?${querystring.stringify(params)}`),
  });
  return data;
};

/**
 * Fetch the progress info concerning staking.
 *
 * @async
 *
 * @returns {SidecarPalletStakingProgress}
 */
const fetchStakingProgress =
  async (): Promise<SidecarPalletStakingProgress> => {
    const {
      data,
    }: {
      data: SidecarPalletStakingProgress;
    } = await network({
      method: "GET",
      url: getSidecarUrl("/pallets/staking/progress"),
    });
    return data;
  };

/**
 * Fetch the transaction params needed to sign a transaction
 *
 * @async
 *
 * @returns {SidecarTransactionMaterial}
 */
const fetchTransactionMaterial = async (
  // By default we don't want any metadata.
  withMetadata = false
): Promise<SidecarTransactionMaterial> => {
  const params = withMetadata ? "?metadata=scale" : "?noMeta=true";
  const {
    data,
  }: {
    data: SidecarTransactionMaterial;
  } = await network({
    method: "GET",
    url: getSidecarUrl(`/transaction/material${params}`),
  });
  return data;
};

/**
 * Fetch the blockchain specs
 *
 * @async
 *
 * @returns {SidecarRuntimeSpec}
 */
const fetchChainSpec = async () => {
  const {
    data,
  }: {
    data: SidecarRuntimeSpec;
  } = await network({
    method: "GET",
    url: getSidecarUrl("/runtime/spec"),
  });
  return data;
};

// Not relevant when not using websocket
export const disconnect = () => {};

/**
 * Returns true if ElectionStatus is Close.
 * If ElectionStatus is Open, some features must be disabled.
 *
 * @async
 *
 * @returns {boolean}
 */
export const isElectionClosed = async (): Promise<boolean> => {
  const progress = await fetchStakingProgress();
  return !progress.electionStatus?.status?.Open;
};

/**
 * Returns true if the address is a new account with no balance.
 *
 * @async
 * @param {*} addr
 *
 * @returns {boolean}
 */
export const isNewAccount = async (addr: string): Promise<boolean> => {
  const { nonce, free } = await fetchBalanceInfo(addr);
  return new BigNumber(0).isEqualTo(nonce) && new BigNumber(0).isEqualTo(free);
};

/**
 * Returns true if the address is a controller, i.e. it is associated to a stash.
 *
 * @async
 * @param {*} addr
 *
 * @returns {boolean}
 */
export const isControllerAddress = async (addr: string): Promise<boolean> => {
  const stash = await fetchStashAddr(addr);
  return !!stash;
};

/**
 * Returns all addresses that are not validators.
 *
 * @async
 * @param {string[]} - address to verify
 *
 * @returns {string[]} - addresses that are not validators
 */
export const verifyValidatorAddresses = async (
  validators: string[]
): Promise<string[]> => {
  const existingValidators = await fetchValidators("all", validators);
  const existingIds = existingValidators.map((v) => v.accountId);
  return validators.filter((v) => !existingIds.includes(v));
};

/**
 * Get all account-related data
 *
 * @async
 * @param {*} addr
 */
export const getAccount = async (addr: string) => {
  const balances = await getBalances(addr);
  const stakingInfo = await getStakingInfo(addr);
  const nominations = await getNominations(addr);
  return { ...balances, ...stakingInfo, nominations };
};

/**
 * Returns all the balances for an account
 *
 * @async
 * @param {*} addr - the account address
 */
const getBalances = async (addr: string) => {
  const balanceInfo = await fetchBalanceInfo(addr);
  // Locked is the highest value among locks
  const totalLocked = balanceInfo.locks.reduce((total, lock) => {
    const amount = new BigNumber(lock.amount);

    if (amount.gt(total)) {
      return amount;
    }

    return total;
  }, new BigNumber(0));
  const balance = new BigNumber(balanceInfo.free);
  const spendableBalance = totalLocked.gt(balance)
    ? new BigNumber(0)
    : balance.minus(totalLocked);
  return {
    blockHeight: balanceInfo.at?.height ? Number(balanceInfo.at.height) : null,
    balance,
    spendableBalance,
    nonce: Number(balanceInfo.nonce),
    lockedBalance: new BigNumber(balanceInfo.miscFrozen),
  };
};

/**
 * Returns all staking-related data for an account
 *
 * @async
 * @param {*} addr
 */
export const getStakingInfo = async (addr: string) => {
  const [stash, controller] = await Promise.all([
    fetchStashAddr(addr),
    fetchControllerAddr(addr),
  ]);

  // If account is not a stash, no need to fetch staking-info (it would return an error)
  if (!controller) {
    return {
      controller: null,
      stash: stash || null,
      unlockedBalance: new BigNumber(0),
      unlockingBalance: new BigNumber(0),
      unlockings: [],
    };
  }

  const [stakingInfo, activeEra, consts] = await Promise.all([
    fetchStakingInfo(addr),
    fetchActiveEra(),
    getConstants(),
  ]);
  const activeEraIndex = Number(activeEra.value?.index || 0);
  const activeEraStart = Number(activeEra.value?.start || 0);
  const blockTime = new BigNumber(consts?.babe?.expectedBlockTime || 6000); // 6000 ms

  const epochDuration = new BigNumber(consts?.babe?.epochDuration || 2400); // 2400 blocks

  const sessionsPerEra = new BigNumber(consts?.staking?.sessionsPerEra || 6); // 6 sessions

  const eraLength = sessionsPerEra
    .multipliedBy(epochDuration)
    .multipliedBy(blockTime)
    .toNumber();
  const unlockings = stakingInfo?.staking.unlocking
    ? stakingInfo?.staking?.unlocking.map<PolkadotUnlocking>((lock) => ({
        amount: new BigNumber(lock.value),
        completionDate: new Date(
          activeEraStart + (Number(lock.era) - activeEraIndex) * eraLength
        ), // This is an estimation of the date of completion, since it depends on block validation speed
      }))
    : [];
  const now = new Date();
  const unlocked = unlockings.filter((lock) => lock.completionDate <= now);
  const unlockingBalance = unlockings.reduce(
    (sum, lock) => sum.plus(lock.amount),
    new BigNumber(0)
  );
  const unlockedBalance = unlocked.reduce(
    (sum, lock) => sum.plus(lock.amount),
    new BigNumber(0)
  );
  const numSlashingSpans = Number(stakingInfo?.numSlashingSpans || 0);
  return {
    controller: controller || null,
    stash: stash || null,
    unlockedBalance,
    unlockingBalance,
    unlockings,
    numSlashingSpans,
  };
};

/**
 * Returns nominations for an account including validator address, status and associated stake.
 *
 * @async
 * @param {*} addr
 *
 * @returns {PolkadotNomination[}
 */
export const getNominations = async (
  addr: string
): Promise<PolkadotNomination[]> => {
  const nominations = await fetchNominations(addr);
  if (!nominations) return [];
  return nominations.targets.map<PolkadotNomination>((nomination) => ({
    address: nomination.address,
    value: new BigNumber(nomination.value || 0),
    status: nomination.status,
  }));
};

/**
 * Returns all the params from the chain to build an extrinsic (a transaction on Substrate)
 *
 * @async
 */
export const getTransactionParams = async () => {
  const material = await fetchTransactionMaterial();
  return {
    blockHash: material.at.hash,
    blockNumber: material.at.height,
    chainName: material.chainName,
    genesisHash: material.genesisHash,
    specName: material.specName,
    transactionVersion: material.txVersion,
    specVersion: material.specVersion,
  };
};

/**
 * Broadcast the transaction to the substrate node
 *
 * @async
 * @param {string} extrinsic - the encoded extrinsic to send
 *
 * @returns {string>} - the broadcasted transaction's hah
 */
export const submitExtrinsic = async (extrinsic: string): Promise<string> => {
  const {
    data,
  }: {
    data: SidecarTransactionBroadcast;
  } = await network({
    method: "POST",
    url: getSidecarUrl("/transaction"),
    data: {
      tx: extrinsic,
    },
  });
  return data.hash;
};

/**
 * Retrieve the transaction fees and weights
 * Note: fees on Substrate are not set by the signer, but directly by the blockchain runtime.
 *
 * @async
 * @param {string} extrinsic - the encoded extrinsic to send with a fake signing
 *
 * @returns {SidecarPaymentInfo}
 */
export const paymentInfo = async (
  extrinsic: string
): Promise<SidecarPaymentInfo> => {
  const {
    data,
  }: {
    data: SidecarPaymentInfo;
  } = await network({
    method: "POST",
    url: getSidecarUrl("/transaction/fee-estimate"),
    data: {
      tx: extrinsic,
    },
  });
  return data;
};

/**
 * List all validators for the current era, and their exposure, and identity.
 *
 * @async
 * @param {string | string[]} stashes - stashes or validator status
 *
 * @returns {PolkadotValidator[]}
 */
export const getValidators = async (
  stashes:
    | SidecarValidatorsParamStatus
    | SidecarValidatorsParamAddresses = "elected"
): Promise<PolkadotValidator[]> => {
  let validators;

  if (Array.isArray(stashes)) {
    validators = await fetchValidators("all", stashes);
  } else {
    validators = await fetchValidators(stashes);
  }

  return validators.map((v) => ({
    address: v.accountId,
    identity: v.identity
      ? [v.identity.displayParent, v.identity.display]
          .filter(Boolean)
          .join(" - ")
          .trim()
      : "",
    nominatorsCount: Number(v.nominatorsCount),
    rewardPoints: v.rewardsPoints ? new BigNumber(v.rewardsPoints) : null,
    commission: new BigNumber(v.commission).dividedBy(
      VALIDATOR_COMISSION_RATIO
    ),
    totalBonded: new BigNumber(v.total),
    selfBonded: new BigNumber(v.own),
    isElected: v.isElected,
    isOversubscribed: v.isOversubscribed,
  }));
};

/**
 * Get Active Era progress
 *
 * @async
 *
 * @returns {PolkadotStakingProgress}
 */
export const getStakingProgress =
  async (): Promise<PolkadotStakingProgress> => {
    const [progress, consts] = await Promise.all([
      fetchStakingProgress(),
      getConstants(),
    ]);
    const activeEra = Number(progress.activeEra);
    const currentBlock = Number(progress.at.height);
    const toggleEstimate = Number(progress.electionStatus?.toggleEstimate);
    const electionClosed = !progress.electionStatus?.status?.Open;
    // Consider election open if in the THERSHOLD blocks before the real expected change
    // It disables staking flows that are subject to fail or block because of election status
    // update while user is signing
    const optimisticElectionClosed =
      electionClosed &&
      activeEra &&
      currentBlock &&
      toggleEstimate &&
      currentBlock >= toggleEstimate - ELECTION_STATUS_OPTIMISTIC_THRESHOLD
        ? false
        : electionClosed;
    return {
      activeEra,
      electionClosed: optimisticElectionClosed,
      maxNominatorRewardedPerValidator:
        Number(consts.staking.maxNominatorRewardedPerValidator) || 128,
      bondingDuration: Number(consts.staking.bondingDuration) || 28,
    };
  };

/**
 * Create a new Registry for creating Polkadot.JS types (or any Substrate)
 *
 * @async
 *
 * @returns {Object} - { registry, extrinsics }
 */
export const getRegistry = async (): Promise<{
  registry: TypeRegistry;
  extrinsics: Extrinsics;
}> => {
  const [material, spec] = await Promise.all([
    getTransactionMaterialWithMetadata(),
    fetchChainSpec(),
  ]);
  const registry: any = new TypeRegistry();
  const metadata = new Metadata(registry, material.metadata);
  // Register types specific to chain/runtimeVersion
  registry.register(
    getSpecTypes(
      registry,
      material.chainName,
      material.specName,
      Number(material.specVersion)
    ) as any
  );
  // Register the chain properties for this registry
  registry.setChainProperties(
    registry.createType("ChainProperties", {
      ss58Format: Number(spec.properties.ss58Format),
      tokenDecimals: Number(spec.properties.tokenDecimals),
      tokenSymbol: spec.properties.tokenSymbol,
    })
  );
  registry.setMetadata(metadata);
  const extrinsics = expandMetadata(registry, metadata).tx;
  return {
    registry,
    extrinsics,
  };
};

/*
 * CACHED REQUESTS
 * NOTE: we don't use the cache from family's `cache.js` to avoid cyclic imports.
 */

/**
 * Cache the fetchConstants to avoid too many calls
 *
 * @async
 *
 * @returns {Promise<Object>} consts
 */
export const getConstants: CacheRes<
  Array<void>,
  Record<string, any>
> = makeLRUCache(
  async (): Promise<Record<string, any>> => fetchConstants(),
  () => "polkadot",
  {
    max: 1, // Store only one constants object since we only have polkadot.
    maxAge: 60 * 60 * 1000, // 1 hour
  }
);

/**
 * Cache the fetchTransactionMaterial(true) to avoid too many calls
 *
 * @async
 *
 * @returns {Promise<Object>} consts
 */
export const getTransactionMaterialWithMetadata: CacheRes<
  Array<void>,
  SidecarTransactionMaterial
> = makeLRUCache(
  async (): Promise<SidecarTransactionMaterial> =>
    fetchTransactionMaterial(true),
  () => "polkadot",
  {
    maxAge: 60 * 60 * 1000, // 1 hour - could be Infinity
  }
);
