import { electionABI, lockedGoldABI } from "@celo/abis";
import { createApi } from "@ledgerhq/coin-evm/api/index";
import { getCoinConfig } from "@ledgerhq/coin-evm/config";
import { createSwapHistoryMap, mergeSubAccounts, getSyncHash } from "@ledgerhq/coin-evm/logic";
import { getNodeApi } from "@ledgerhq/coin-evm/network/node/index";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import {
  encodeTokenAccountId,
  emptyHistoryCache,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { makeSync, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";

import type {
  GetAccountShape,
  AccountShapeInfo,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { getEnv } from "@ledgerhq/live-env";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { TokenAccount, SyncConfig } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { NATIVE_FEE_CURRENCY_MARKER } from "../constants";
import { getCeloClient } from "../network/client";
import { getRegistryAddressFor } from "../network/registry";
import {
  getAccountRegistrationStatus,
  getCeloTransactionFeeCurrency,
  getPendingWithdrawals,
  getVotes,
} from "../network/sdk";
import { CeloAccount, isCeloOperationExtra } from "../types/types";
import { getTokenFromAsset } from "./getTokenFromAsset";

const operationsTypes = [
  "IN",
  "OUT",
  "NONE",
  "LOCK",
  "UNLOCK",
  "WITHDRAW",
  "REVOKE",
  "ACTIVATE",
  "REGISTER",
  "VOTE",
] as const;

const SAFE_REORG_THRESHOLD = 80;

type OperationType = (typeof operationsTypes)[number];

const getTypeFromString = (value: string) => {
  return operationsTypes.find(item => item === value) ?? "NONE";
};

const resolveTypesFromContracts = (item: {
  type: OperationType;
  senders: string[];
  recipients: string[];
  address: string;
  value: bigint;
  contracts: {
    locked: string;
    election: string;
  };
}): OperationType => {
  if (item.type === "OUT" && item.recipients.includes(item.contracts.locked)) {
    const isZero = new BigNumber(item.value.toString()).isEqualTo(0);
    return isZero ? "UNLOCK" : "LOCK";
  }
  if (item.type === "OUT" && item.recipients.includes(item.contracts.election)) {
    return "VOTE";
  }

  return item.type;
};

/** eth_getTransactionByHash is a cheap read, so a higher fan-out is safe. */
const FEE_CURRENCY_ENRICH_CONCURRENCY = 10;

const readFeeCurrencyAddress = (extra: unknown): string | undefined =>
  isCeloOperationExtra(extra) ? extra.feeCurrencyAddress : undefined;

/**
 * NATIVE sentinels inside the reorg-safe window are excluded so they get
 * re-fetched — a wrongly-persisted sentinel self-heals once the block settles.
 * Past the reorg window the marker is trusted permanently.
 */
const collectKnownFeeCurrencies = (
  account: CeloAccount | undefined,
  currentBlockHeight: number,
): Map<string, string> => {
  const map = new Map<string, string>();
  if (!account) return map;
  const reorgCutoff = currentBlockHeight - SAFE_REORG_THRESHOLD;
  const add = (
    ops: { hash: string; extra?: unknown; blockHeight: number | null | undefined }[],
  ) => {
    for (const op of ops) {
      const stored = readFeeCurrencyAddress(op.extra);
      if (!stored) continue;
      // Re-validate NATIVE sentinels while the op is still in the reorg window.
      if (
        stored === NATIVE_FEE_CURRENCY_MARKER &&
        typeof op.blockHeight === "number" &&
        op.blockHeight > reorgCutoff
      ) {
        continue;
      }
      map.set(op.hash, stored);
    }
  };
  add(account.operations);
  for (const sub of account.subAccounts ?? []) add(sub.operations);
  return map;
};

const getOperationsList = async ({
  info,
  config,
  accountId,
  contracts,
  api,
  currentBlockHeight,
}: {
  info: AccountShapeInfo<CeloAccount>;
  config: SyncConfig;
  accountId: string;
  contracts: {
    locked: string;
    election: string;
  };
  api: ReturnType<typeof createApi>;
  currentBlockHeight: number;
}) => {
  const { address, currency, initialAccount } = info;
  const blacklistedTokenIds = config.blacklistedTokenIds || [];

  const syncHash = await getSyncHash(currency, blacklistedTokenIds);
  const shouldSyncFromScratch =
    syncHash !== initialAccount?.syncHash || initialAccount === undefined;
  const latestSyncedHeight = shouldSyncFromScratch ? 0 : initialAccount.blockHeight;
  const rawOperationsList = (
    await api.listOperations(address, {
      minHeight: Math.max(latestSyncedHeight - SAFE_REORG_THRESHOLD, 0),
    })
  ).items;

  const operationsList = await Promise.all(
    rawOperationsList.map(async item => {
      const token = await getTokenFromAsset(currency, item.asset);
      const type = getTypeFromString(item.type);
      const tokenAccountId = token ? encodeTokenAccountId(accountId, token) : accountId;
      const isSubAccount = token?.ticker !== "CELO" && item.asset.type !== "native";

      const operation = {
        id: item.id,
        hash: item.tx.hash,
        type: resolveTypesFromContracts({
          type,
          senders: item.senders,
          recipients: item.recipients,
          address,
          value: item.value,
          contracts: contracts,
        }),
        value: new BigNumber((item.details?.assetAmount as string) || item.value.toString()),
        senders: item.senders,
        recipients: item.recipients,
        blockHeight: item.tx.block.height,
        blockHash: item.tx.block.hash,
        accountId: isSubAccount ? tokenAccountId : accountId,
        date: item.tx.date,
        hasFailed: item.tx.failed,
        fee: new BigNumber(item.tx.fees.toString()),
        transactionSequenceNumber: new BigNumber(0),
        extra: {},
        ...(token ? { token } : undefined),
        isSubAccount,
      };

      return operation;
    }),
  );

  // The explorer doesn't expose `feeCurrency`, so we hit the RPC once per
  // unseen tx hash. The map is returned alongside the operations so the caller
  // can re-apply it after `mergeOps`, which ignores `extra`.
  const knownByHash = collectKnownFeeCurrencies(initialAccount, currentBlockHeight);
  const uniqueHashes = Array.from(new Set(operationsList.map(o => o.hash)));
  const hashesToFetch = uniqueHashes.filter(h => !knownByHash.has(h));

  // Per-hash failure resolves to `undefined` so a single bad RPC doesn't poison
  // the whole batch; the missing hash retries on the next sync.
  const results = await promiseAllBatched(
    FEE_CURRENCY_ENRICH_CONCURRENCY,
    hashesToFetch,
    (h: string) => getCeloTransactionFeeCurrency(h).catch(() => undefined),
  );
  const fetched = new Map<string, string>();
  hashesToFetch.forEach((h, idx) => {
    const r = results[idx];
    if (r === undefined) return; // RPC error — leave unmarked so we retry
    // null = confirmed not CIP-64; persist the sentinel so future syncs skip.
    fetched.set(h, r ?? NATIVE_FEE_CURRENCY_MARKER);
  });

  const feeCurrencyByHash = new Map<string, string>(knownByHash);
  for (const [h, v] of fetched) feeCurrencyByHash.set(h, v);

  return { operations: operationsList, feeCurrencyByHash };
};

const getSubAccounts = async ({
  list,
  blacklistedTokenIds = [],
  accountId,
  info,
}: {
  list: Awaited<ReturnType<typeof getOperationsList>>["operations"];
  blacklistedTokenIds: string[];
  accountId: string;
  info: Parameters<GetAccountShape<CeloAccount>>[0];
}) => {
  type TokenSchema = Required<(typeof list)[number]>;

  // Type Narrowing to set list of item with correct Schema
  const filterTokens = (item: (typeof list)[number]): item is TokenSchema =>
    item.isSubAccount &&
    !blacklistedTokenIds.includes(item.token?.id || "") &&
    !!item.token?.ticker;
  const erc20Operations = list.filter(filterTokens);

  const swapHistoryMap = createSwapHistoryMap(info.initialAccount);
  const tokensByKeys: Record<string, TokenAccount> = {};

  erc20Operations.reduce((acc, item) => {
    if (!acc[item.token.ticker]) {
      const tokenAccountId = item.token ? encodeTokenAccountId(accountId, item.token) : "";
      acc[item.token.ticker] = {
        type: "TokenAccount",
        id: tokenAccountId,
        parentId: accountId,
        token: item.token,
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
        creationDate: item.date,
        operations: [],
        operationsCount: 0,
        pendingOperations: [],
        balanceHistoryCache: emptyHistoryCache,
        swapHistory: swapHistoryMap.get(item.token.id) || [],
      };
    }

    const { token, ...itemRest } = item;

    acc[item.token.ticker].operations.push(itemRest);
    acc[item.token.ticker].operationsCount = acc[item.token.ticker].operations.length;

    return acc;
  }, tokensByKeys);

  const nodeApi = getNodeApi(info.currency);
  const tokensList = Object.values(tokensByKeys);
  const tokensListWithBalance = await Promise.all(
    tokensList.map(async item => {
      const balance = await nodeApi.getTokenBalance(
        info.currency,
        info.address,
        item.token.contractAddress,
      );

      return {
        ...item,
        balance,
        spendableBalance: balance,
      };
    }),
  );

  return tokensListWithBalance;
};

export const getAccountShape: GetAccountShape<CeloAccount> = async (info, config) => {
  const { address, currency, initialAccount, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];
  const client = getCeloClient();
  const [electionAddress, lockedGoldAddress] = await Promise.all([
    getRegistryAddressFor("Election"),
    getRegistryAddressFor("LockedGold"),
  ]);

  const [maxNumGroupsVotedFor, lockedBalance, nonvotingLockedBalance] = await Promise.all([
    client.readContract({
      address: electionAddress,
      abi: electionABI,
      functionName: "maxNumGroupsVotedFor",
    }),
    client.readContract({
      address: lockedGoldAddress,
      abi: lockedGoldABI,
      functionName: "getAccountTotalLockedGold",
      args: [address as `0x${string}`],
    }),
    client.readContract({
      address: lockedGoldAddress,
      abi: lockedGoldABI,
      functionName: "getAccountNonvotingLockedGold",
      args: [address as `0x${string}`],
    }),
  ]);

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const accountRegistrationStatus = await getAccountRegistrationStatus(address);
  const pendingWithdrawals = accountRegistrationStatus ? await getPendingWithdrawals(address) : [];
  const votes = accountRegistrationStatus ? await getVotes(address) : [];

  const lockedBalanceBN = new BigNumber(lockedBalance.toString());
  const nonvotingLockedBalanceBN = new BigNumber(nonvotingLockedBalance.toString());

  const configEvm = {
    ...getCoinConfig(currency.id).info,
  } as const;
  const blacklistedTokenIds = config.blacklistedTokenIds || [];
  const syncHash = await getSyncHash(currency, blacklistedTokenIds);

  const nodeApi = getNodeApi(currency);
  const api = createApi(configEvm, currency.id);
  const blockInfo = await api.lastBlock();
  const balance = await nodeApi.getCoinBalance(currency, address);

  const isTokensEnabled = getEnv("ENABLE_CELO_TOKENS");

  const { operations: operationsList, feeCurrencyByHash } = await getOperationsList({
    info,
    config,
    accountId,
    contracts: { locked: lockedGoldAddress, election: electionAddress },
    api,
    currentBlockHeight: blockInfo.height || 0,
  });

  const nativeOperations = operationsList.filter(({ isSubAccount }) => !isSubAccount);

  const shouldSyncFromScratch =
    syncHash !== initialAccount?.syncHash || initialAccount === undefined;
  const mergedOperations = mergeOps(shouldSyncFromScratch ? [] : oldOperations, nativeOperations);

  // Back-fill `feeCurrencyAddress` post-merge: `mergeOps` ignores `extra` when
  // deduping. The map is authoritative (a freshly fetched value overrides any
  // stale stored NATIVE sentinel that was excluded for re-validation).
  const applyFeeCurrencyBackfill = <T extends { hash: string; extra?: unknown }>(op: T): T => {
    const fresh = feeCurrencyByHash.get(op.hash);
    if (!fresh) return op;
    if (readFeeCurrencyAddress(op.extra) === fresh) return op;
    const base = typeof op.extra === "object" && op.extra !== null ? op.extra : {};
    return { ...op, extra: { ...base, feeCurrencyAddress: fresh } };
  };
  const operations = mergedOperations.map(applyFeeCurrencyBackfill);

  let subAccounts: TokenAccount[] = [];
  if (isTokensEnabled) {
    const subAccountsList = await getSubAccounts({
      list: operationsList,
      blacklistedTokenIds,
      accountId,
      info,
    });

    const initialSubAccounts = initialAccount?.subAccounts?.filter(item => {
      return item.token.ticker !== "CELO";
    });

    const mergedSubAccounts =
      shouldSyncFromScratch && initialAccount?.subAccounts
        ? subAccountsList
        : (mergeSubAccounts(
            {
              ...initialAccount,
              subAccounts: initialSubAccounts || [],
            } as CeloAccount,
            subAccountsList,
          ) as TokenAccount[]);

    // mergeSubAccounts runs `mergeOps` internally, so the same backfill applies.
    subAccounts = mergedSubAccounts.map(sub => ({
      ...sub,
      operations: sub.operations.map(applyFeeCurrencyBackfill),
    }));
  }

  const shape: Partial<CeloAccount> = {
    id: accountId,
    balance: balance.plus(lockedBalanceBN),
    blockHeight: blockInfo.height || 0,
    operations,
    operationsCount: operations.length,
    spendableBalance: balance,
    subAccounts,
    syncHash: syncHash,
    celoResources: {
      registrationStatus: accountRegistrationStatus,
      lockedBalance: lockedBalanceBN,
      nonvotingLockedBalance: nonvotingLockedBalanceBN,
      pendingWithdrawals,
      votes,
      electionAddress,
      lockedGoldAddress,
      maxNumGroupsVotedFor: new BigNumber(maxNumGroupsVotedFor.toString()),
    },
  };

  return shape;
};

// `shouldMergeOps: false`: the outer mergeOps in makeSync would re-dedupe via
// `sameOp` (which ignores `extra`) and strip the feeCurrencyAddress backfill
// that getAccountShape just applied.
export const sync = makeSync({ getAccountShape, shouldMergeOps: false });
