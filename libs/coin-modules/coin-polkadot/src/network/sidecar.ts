import network from "@ledgerhq/live-network";
import { hexToBn } from "@polkadot/util";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { TypeRegistry } from "@polkadot/types";
import { Extrinsics } from "@polkadot/types/metadata/decorate/types";
import { BigNumber } from "bignumber.js";
import { type PolkadotCoinConfig } from "../config";
import {
  DEFAULT_CHAIN_CONSTANTS_CACHE_TTL_MS,
  DEFAULT_ELECTION_STATUS_THRESHOLD,
  DEFAULT_TRANSACTION_MATERIAL_CACHE_TTL_MS,
} from "../constants";
import type {
  PolkadotValidator,
  PolkadotStakingProgress,
  PolkadotUnlocking,
  PolkadotNomination,
} from "../types";
import { makeConfigurableLRUCache } from "./cache";
import { createRegistryAndExtrinsics } from "./common";
import node from "./node";
import type {
  SidecarAccountBalanceInfo,
  SidecarPalletStorageItem,
  SidecarStakingInfo,
  SidecarValidatorsParamStatus,
  SidecarValidatorsParamAddresses,
  SidecarValidators,
  SidecarPalletStakingProgress,
  SidecarTransactionMaterial,
  SidecarTransactionBroadcast,
  SidecarPaymentInfo,
  SidecarRuntimeSpec,
  BlockInfo,
} from "./types";

/**
 * Returns the full indexer url for en route endpoint.
 *
 * @param {*} route
 *
 * @returns {string}
 */
const getSidecarUrl = (config: PolkadotCoinConfig, route: string, currencyId?: string): string => {
  let sidecarUrl = config.sidecar.url;

  if (
    currencyId === "assethub_polkadot" &&
    route.startsWith("/pallets/staking") &&
    !config.hasBeenMigrated
  ) {
    route = `/rc${route}`;
  } else if (
    currencyId === "westend" &&
    (route.startsWith("/pallets/staking") || route.startsWith("/transaction"))
  ) {
    // Fetch Staking Info from Westend AssetHub (remove /rc)
    sidecarUrl = sidecarUrl.replace("/rc", "");
  }
  return `${sidecarUrl}${route || ""}`;
};

const getElectionOptimisticThreshold = (config: PolkadotCoinConfig): number => {
  return config.staking?.electionStatusThreshold ?? DEFAULT_ELECTION_STATUS_THRESHOLD;
};

const VALIDATOR_COMISSION_RATIO = 1000000000;

const isStakingSupported = (config: PolkadotCoinConfig): boolean => {
  return (
    config.status.type === "active" &&
    (config.status.features ?? []).some(
      feature => feature.id === "staking_txs" && feature.status === "active",
    )
  );
};

/** Safe default used when staking progress can't be fetched (unsupported network or error). */
export const DEFAULT_STAKING_PROGRESS: PolkadotStakingProgress = {
  electionClosed: true,
  activeEra: 0,
  maxNominatorRewardedPerValidator: 128,
  bondingDuration: 28,
};

// Fallback values used when Sidecar const endpoints are unreachable.
const DEFAULT_CONSTANTS = {
  expectedBlockTime: 6000, // ms
  epochDuration: 2400, // blocks
  sessionsPerEra: 6,
  maxNominatorRewardedPerValidator: 512,
  bondingDuration: 28, // eras
};

type ChainConstants = typeof DEFAULT_CONSTANTS;

type SidecarPalletConstsResponse = {
  items: Array<{ name: string; value: string }>;
};

async function fetchPalletConsts(
  logger: Logger,
  config: PolkadotCoinConfig,
  palletId: string,
  currencyId?: string,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  try {
    const { data } = await callSidecar<SidecarPalletConstsResponse>(
      config,
      `/pallets/${palletId}/consts`,
      currencyId,
    );
    for (const item of data.items) {
      const parsed = hexToBn(item.value, { isLe: true }).toNumber();
      if (Number.isFinite(parsed)) {
        result.set(item.name, parsed);
      }
    }
  } catch (e) {
    logger("polkadot/sidecar", `failed to fetch ${palletId} consts, using fallbacks`, { error: e });
  }
  return result;
}

const getChainConstants = makeConfigurableLRUCache(
  async (
    logger: Logger,
    config: PolkadotCoinConfig,
    currencyId?: string,
  ): Promise<ChainConstants> => {
    const stakingConsts = await fetchPalletConsts(logger, config, "staking", currencyId);
    return {
      expectedBlockTime: DEFAULT_CONSTANTS.expectedBlockTime,
      epochDuration: DEFAULT_CONSTANTS.epochDuration,
      sessionsPerEra: stakingConsts.get("SessionsPerEra") ?? DEFAULT_CONSTANTS.sessionsPerEra,
      maxNominatorRewardedPerValidator:
        stakingConsts.get("MaxExposurePageSize") ??
        DEFAULT_CONSTANTS.maxNominatorRewardedPerValidator,
      bondingDuration: stakingConsts.get("BondingDuration") ?? DEFAULT_CONSTANTS.bondingDuration,
    };
  },
  (_logger, _config, currencyId) => currencyId || "polkadot",
  (_logger, config) =>
    config.sidecar.chainConstantsCacheTtlMs ?? DEFAULT_CHAIN_CONSTANTS_CACHE_TTL_MS,
  1,
);

// blocks = 2 minutes 30

async function callSidecar<T>(
  config: PolkadotCoinConfig,
  route: string,
  currencyId?: string,
  method: "GET" | "POST" = "GET",
  data?: unknown,
) {
  const credentials = config.sidecar.credentials;
  const headers = credentials ? { Authorization: "Basic " + credentials } : {};
  return network<T>({
    headers,
    method,
    url: getSidecarUrl(config, route, currencyId),
    data,
  });
}

/**
 * Fetch Balance from the api.
 *
 * @async
 * @param {string} addr
 *
 * @returns {SidecarAccountBalanceInfo}
 */
const fetchBalanceInfo = async (
  config: PolkadotCoinConfig,
  addr: string,
  currencyId?: string,
): Promise<SidecarAccountBalanceInfo> => {
  const { data } = await callSidecar<SidecarAccountBalanceInfo>(
    config,
    `/accounts/${addr}/balance-info`,
    currencyId,
  );
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
const fetchStashAddr = async (
  config: PolkadotCoinConfig,
  addr: string,
  currencyId?: string,
): Promise<string | null> => {
  const {
    data,
  }: {
    data: SidecarPalletStorageItem;
  } = await callSidecar(config, `/pallets/staking/storage/ledger?keys[]=${addr}`, currencyId);
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
const fetchControllerAddr = async (
  config: PolkadotCoinConfig,
  addr: string,
  currencyId?: string,
): Promise<string | null> => {
  const {
    data,
  }: {
    data: SidecarPalletStorageItem;
  } = await callSidecar(config, `/pallets/staking/storage/bonded?keys[]=${addr}`, currencyId);
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
const fetchStakingInfo = async (
  config: PolkadotCoinConfig,
  addr: string,
  currencyId?: string,
): Promise<SidecarStakingInfo> => {
  return node.fetchStakingInfo(config, addr, currencyId);
};

/**
 * Returns the activeEra info
 *
 * @async
 *
 * @returns {SidecarPalletStorageItem}
 */
const fetchActiveEra = async (
  config: PolkadotCoinConfig,
  currencyId?: string,
): Promise<SidecarPalletStorageItem> => {
  const {
    data,
  }: {
    data: SidecarPalletStorageItem;
  } = await callSidecar(config, "/pallets/staking/storage/activeEra", currencyId);
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
export const getMinimumBondBalance = async (
  config: PolkadotCoinConfig,
  currencyId?: string,
): Promise<BigNumber> => {
  const { data }: { data: SidecarPalletStorageItem } = await callSidecar(
    config,
    `/pallets/staking/storage/minNominatorBond`,
    currencyId,
  );

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
  config: PolkadotCoinConfig,
  status: SidecarValidatorsParamStatus = "all",
  addresses?: SidecarValidatorsParamAddresses,
): Promise<SidecarValidators> => {
  return await node.fetchValidators(config, status, addresses);
};

/**
 * Fetch the progress info concerning staking.
 *
 * @async
 *
 * @returns {SidecarPalletStakingProgress}
 */
const fetchStakingProgress = async (
  config: PolkadotCoinConfig,
  currencyId?: string,
): Promise<SidecarPalletStakingProgress> => {
  const {
    data,
  }: {
    data: SidecarPalletStakingProgress;
  } = await callSidecar(config, "/pallets/staking/progress", currencyId);
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
  config: PolkadotCoinConfig,
  // By default we don't want any metadata.
  currencyId?: string,
  withMetadata = false,
): Promise<SidecarTransactionMaterial> => {
  const params = withMetadata ? "?metadata=scale" : "?noMeta=true";
  const {
    data,
  }: {
    data: SidecarTransactionMaterial;
  } = await callSidecar(config, `/transaction/material${params}`, currencyId);
  return data;
};

/**
 * Fetch the blockchain specs
 *
 * @async
 *
 * @returns {SidecarRuntimeSpec}
 */
export const fetchChainSpec = async (config: PolkadotCoinConfig, currencyId?: string) => {
  const {
    data,
  }: {
    data: SidecarRuntimeSpec;
  } = await callSidecar(config, "/runtime/spec", currencyId);
  return data;
};

/**
 * Returns true if ElectionStatus is Close.
 * If ElectionStatus is Open, some features must be disabled.
 *
 * @async
 *
 * @returns {boolean}
 */
export const isElectionClosed = async (
  config: PolkadotCoinConfig,
  currencyId: string,
): Promise<boolean> => {
  if (!isStakingSupported(config)) return true;

  const progress = await fetchStakingProgress(config, currencyId);
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
export const isNewAccount = async (
  config: PolkadotCoinConfig,
  addr: string,
  currencyId?: string,
): Promise<boolean> => {
  const { nonce, free } = await fetchBalanceInfo(config, addr, currencyId);
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
export const isControllerAddress = async (
  config: PolkadotCoinConfig,
  addr: string,
  currencyId?: string,
): Promise<boolean> => {
  const stash = await fetchStashAddr(config, addr, currencyId);
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
  config: PolkadotCoinConfig,
  validators: string[],
): Promise<string[]> => {
  const existingValidators = await fetchValidators(config, "all", validators);
  const existingIds = existingValidators.map(v => v.accountId);
  return validators.filter(v => !existingIds.includes(v));
};

/**
 * Get all account-related data
 *
 * @async
 * @param {*} addr
 */
export const getAccount = async (
  logger: Logger,
  config: PolkadotCoinConfig,
  addr: string,
  currencyId: string,
) => {
  const balances = await getBalances(config, addr, currencyId);
  const stakingInfo = await getStakingInfo(logger, config, addr, currencyId);
  const nominations = await getNominations(logger, config, addr);

  const account = { ...balances, ...stakingInfo, nominations };
  account.balance = account.balance
    .plus(account.lockedBalance.minus(account.unlockingBalance))
    .plus(account.unlockingBalance.minus(account.unlockedBalance));

  return account;
};

/**
 * Returns all the balances for an account
 *
 * @async
 * @param {*} addr - the account address
 */
export const getBalances = async (
  config: PolkadotCoinConfig,
  addr: string,
  currencyId?: string,
) => {
  const balanceInfo = await fetchBalanceInfo(config, addr, currencyId);

  return {
    blockHeight: Number(balanceInfo.at.height),
    balance: new BigNumber(balanceInfo.free),
    spendableBalance: new BigNumber(balanceInfo.transferable || "0"),
    nonce: Number(balanceInfo.nonce),
    lockedBalance: new BigNumber(balanceInfo.reserved || "0"),
  };
};

/**
 * Returns all staking-related data for an account
 *
 * @async
 * @param {*} addr
 */
export const getStakingInfo = async (
  logger: Logger,
  config: PolkadotCoinConfig,
  addr: string,
  currencyId: string,
) => {
  const [stash, controller] = await Promise.all([
    fetchStashAddr(config, addr, currencyId),
    fetchControllerAddr(config, addr, currencyId),
  ]);
  // If account is not a stash, no need to fetch staking-info (it would return an error)
  if (!controller || !isStakingSupported(config)) {
    return {
      controller: null,
      stash: stash || null,
      unlockedBalance: new BigNumber(0),
      unlockingBalance: new BigNumber(0),
      unlockings: [],
    };
  }

  const [stakingInfo, activeEra, chainConsts] = await Promise.all([
    fetchStakingInfo(config, addr, currencyId),
    fetchActiveEra(config, currencyId),
    getChainConstants(logger, config, currencyId),
  ]);

  const activeEraIndex = Number(activeEra.value?.index || 0);
  const activeEraStart = Number(activeEra.value?.start || 0);
  const blockTime = new BigNumber(chainConsts.expectedBlockTime);
  const epochDuration = new BigNumber(chainConsts.epochDuration);
  const sessionsPerEra = new BigNumber(chainConsts.sessionsPerEra);

  const eraLength = sessionsPerEra.multipliedBy(epochDuration).multipliedBy(blockTime).toNumber();
  const unlockings = stakingInfo?.staking.unlocking
    ? stakingInfo?.staking?.unlocking.map<PolkadotUnlocking>(lock => {
        return {
          amount: new BigNumber(lock.value),
          // This is an estimation of the date of completion, since it depends on block validation speed
          completionDate: new Date(
            activeEraStart + (Number(lock.era) - activeEraIndex) * eraLength,
          ),
        };
      })
    : [];
  const now = new Date();
  const unlocked = unlockings.filter(lock => lock.completionDate <= now);
  const unlockingBalance = unlockings.reduce(
    (sum, lock) => sum.plus(lock.amount),
    new BigNumber(0),
  );
  const unlockedBalance = unlocked.reduce((sum, lock) => sum.plus(lock.amount), new BigNumber(0));
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
const getNominations = async (
  logger: Logger,
  config: PolkadotCoinConfig,
  addr: string,
): Promise<PolkadotNomination[]> => {
  try {
    const nominations = await node.fetchNominations(config, addr);

    if (!nominations) {
      return [];
    }
    return nominations.targets.map<PolkadotNomination>(nomination => ({
      address: nomination.address,
      value: new BigNumber(nomination.value || 0),
      status: nomination.status,
    }));
  } catch (error) {
    logger("polkadot", `failed to fetch nominations ${addr}`, {
      error,
    });
    return [];
  }
};

/**
 * Returns all the params from the chain to build an extrinsic (a transaction on Substrate)
 *
 * @async
 */
export const getTransactionParams = async (config: PolkadotCoinConfig, currencyId?: string) => {
  const material = await fetchTransactionMaterial(config, currencyId, false);
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

type SubmitExtrinsicDryRunResponse = {
  // "DispatchOutcome": the call would succeed.
  // "DispatchError": the call would be dispatched but fail (result holds { post_info, error }).
  // "TransactionValidityError": the tx is invalid (result holds the validity error directly).
  resultType: "DispatchOutcome" | "DispatchError" | "TransactionValidityError";
  result: {
    post_info?: Record<string, unknown>;
    // present when resultType === "DispatchError"
    error?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

/**
 * We run a dry run of the extrinsic to check if the transaction is valid and eventually get a precise error or what is wrong with transaction
 */
export const submitExtrinsicDryRun = async (
  config: PolkadotCoinConfig,
  extrinsic: string,
  currencyId?: string,
): Promise<SubmitExtrinsicDryRunResponse> => {
  const { registry } = await getRegistry(config, currencyId);
  const decoded = registry.createType("Extrinsic", extrinsic);
  const callHex = decoded.method.toHex();
  const senderAddress = decoded.signer.toString();

  const { data } = await callSidecar<SubmitExtrinsicDryRunResponse>(
    config,
    "/transaction/dry-run",
    currencyId,
    "POST",
    {
      tx: callHex,
      senderAddress,
    },
  );

  if (data.resultType === "DispatchError") {
    throw new Error(`polkadot: ${JSON.stringify(data.result.error ?? data.result)}`);
  }
  if (data.resultType === "TransactionValidityError") {
    throw new Error(`polkadot: ${JSON.stringify(data.result)}`);
  }

  return data;
};

/**
 * Broadcast the transaction to the substrate node
 *
 * @async
 * @param {string} extrinsic - the encoded extrinsic to send
 *
 * @returns {string>} - the broadcasted transaction's hah
 */
export const submitExtrinsic = async (
  config: PolkadotCoinConfig,
  extrinsic: string,
  currencyId?: string,
): Promise<string> => {
  const {
    data,
  }: {
    data: SidecarTransactionBroadcast;
  } = await callSidecar(config, "/transaction", currencyId, "POST", {
    tx: extrinsic,
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
  config: PolkadotCoinConfig,
  extrinsic: string,
  currencyId?: string,
): Promise<SidecarPaymentInfo> => {
  const {
    data,
  }: {
    data: SidecarPaymentInfo;
  } = await callSidecar(config, "/transaction/fee-estimate", currencyId, "POST", {
    tx: extrinsic,
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
  config: PolkadotCoinConfig,
  stashes: SidecarValidatorsParamStatus | SidecarValidatorsParamAddresses = "elected",
): Promise<PolkadotValidator[]> => {
  let validators;

  if (Array.isArray(stashes)) {
    validators = await fetchValidators(config, "all", stashes);
  } else {
    validators = await fetchValidators(config, stashes);
  }

  return validators.map(v => ({
    address: v.accountId,
    identity: v.identity
      ? [v.identity.displayParent, v.identity.display].filter(Boolean).join(" - ").trim()
      : "",
    nominatorsCount: Number(v.nominatorsCount),
    rewardPoints: v.rewardsPoints ? new BigNumber(v.rewardsPoints) : null,
    commission: new BigNumber(v.commission).dividedBy(VALIDATOR_COMISSION_RATIO),
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
export const getStakingProgress = async (
  logger: Logger,
  config: PolkadotCoinConfig,
  currencyId: string,
): Promise<PolkadotStakingProgress> => {
  if (!isStakingSupported(config)) {
    return DEFAULT_STAKING_PROGRESS;
  }

  const [progress, chainConsts] = await Promise.all([
    fetchStakingProgress(config, currencyId),
    getChainConstants(logger, config, currencyId),
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
    currentBlock >= toggleEstimate - getElectionOptimisticThreshold(config)
      ? false
      : electionClosed;
  return {
    activeEra,
    electionClosed: optimisticElectionClosed,
    maxNominatorRewardedPerValidator: chainConsts.maxNominatorRewardedPerValidator,
    bondingDuration: chainConsts.bondingDuration,
  };
};

/**
 * Create a new Registry for creating Polkadot.JS types (or any Substrate)
 *
 * @async
 *
 * @returns {Object} - { registry, extrinsics }
 */
export const getRegistry = async (
  config: PolkadotCoinConfig,
  currencyId?: string,
): Promise<{
  registry: TypeRegistry;
  extrinsics: Extrinsics;
}> => {
  const [material, spec] = await Promise.all([
    getTransactionMaterialWithMetadata(config, currencyId),
    fetchChainSpec(config, currencyId),
  ]);
  return createRegistryAndExtrinsics(material, spec);
};
export const getMetadata = async (
  config: PolkadotCoinConfig,
  callData: string,
  includedInExtrinsic: string,
  includedInSignedData: string,
  currencyId?: string,
): Promise<{ metadataBlob: string; metadataHash: string }> => {
  const { data } = await callSidecar<{ metadataBlob: string; metadataHash: string }>(
    config,
    "/transaction/metadata-blob",
    currencyId,
    "POST",
    {
      callData,
      includedInExtrinsic,
      includedInSignedData,
    },
  );

  return { metadataBlob: data.metadataBlob, metadataHash: data.metadataHash };
};

/**
 * Get lastest block info
 */
export const getLastBlock = async (
  config: PolkadotCoinConfig,
  currencyId?: string,
): Promise<{ hash: string; height: number; time: Date }> => {
  const { data } = await callSidecar<BlockInfo>(config, "/blocks/head", currencyId);
  return { hash: data.hash, height: parseInt(data.number), time: new Date() };
};

/*
 * CACHED REQUESTS
 * NOTE: we don't use the cache from family's `cache.js` to avoid cyclic imports.
 */
/**
 * Cache the fetchTransactionMaterial(true) to avoid too many calls
 *
 * @async
 *
 * @returns {Promise<Object>} consts
 */
export const getTransactionMaterialWithMetadata = makeConfigurableLRUCache(
  async (config: PolkadotCoinConfig, currencyId?: string): Promise<SidecarTransactionMaterial> =>
    fetchTransactionMaterial(config, currencyId, true),
  // `config` is deterministic per currency, so it isn't part of the cache key — but it must be in
  // the key extractor's parameter list so `makeLRUCache` infers the full `(config, currencyId?)`
  // argument tuple; otherwise the cached wrapper is typed to accept only `config`.
  (_config, currencyId) => currencyId || "polkadot",
  (config: PolkadotCoinConfig) =>
    config.sidecar.transactionMaterialCacheTtlMs ?? DEFAULT_TRANSACTION_MATERIAL_CACHE_TTL_MS,
);
