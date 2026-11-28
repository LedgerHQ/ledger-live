import { electionABI, lockedGoldABI } from "@celo/abis";
import { createApi } from "@ledgerhq/coin-evm/api";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { getCoinConfig } from "../config";
import type { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/index";
import type { Context } from "@ledgerhq/coin-module-framework/config";

type EvmContext = Context<EvmConfigInfo>;
import { createSwapHistoryMap, mergeSubAccounts, getSyncHash } from "./syncHelpers";
import { getNodeApi } from "@ledgerhq/coin-evm/network";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import {
  encodeTokenAccountId,
  emptyHistoryCache,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { makeSync, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { log } from "@ledgerhq/logs";

import type {
  GetAccountShape,
  AccountShapeInfo,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { getEnv } from "@ledgerhq/live-env";
import type {
  AccountLike,
  Operation as OperationLive,
  OperationType as OperationTypeLive,
  TokenAccount,
  SyncConfig,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCeloClient } from "../network/client";
import { getRegistryAddressFor } from "../network/registry";
import { getAccountRegistrationStatus, getPendingWithdrawals, getVotes } from "../network/sdk";
import { CeloAccount, CeloOperationExtra } from "../types/types";
import { getTokenFromAsset } from "./getTokenFromAsset";

const buildEvmContext = (currencyId: string): EvmContext => ({
  config: () => Promise.resolve().then(() => getCoinConfig(currencyId).info),
  logger: () => {},
});

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

/** Adapters send the nonce as a string or a number; the framework types it as a bigint. */
const parseSequence = (sequence: unknown): BigNumber | undefined => {
  if (BigNumber.isBigNumber(sequence)) return sequence;
  if (typeof sequence === "bigint") return new BigNumber(sequence.toString());
  if (typeof sequence === "string" || typeof sequence === "number") {
    return new BigNumber(sequence);
  }
  return undefined;
};

/**
 * The explorer's nonce, which `postSync` compares with the optimistic op's to
 * drop it once its tx is synced. A missing nonce stays unset rather than 0, which would claim one.
 */
const toSequenceNumber = (sequence: unknown): BigNumber | undefined => {
  const value = parseSequence(sequence);
  return value?.isNaN() ? undefined : value;
};

/**
 * A token row carries the nonce of whoever sent the tx, which is in `parentSenders` and absent when
 * the account did not send it (a third-party `transferFrom`).
 */
const isSentByAccount = (item: Operation, address: string): boolean => {
  const txSenders = item.asset.type === "native" ? item.senders : item.details?.parentSenders;
  return (
    Array.isArray(txSenders) &&
    txSenders.some(sender => String(sender).toLowerCase() === address.toLowerCase())
  );
};

/** The lower-case contract of the token that paid a fee, when it is not CELO. */
const readFeeAsset = (feesAsset: AssetInfo | undefined): string | undefined =>
  feesAsset && feesAsset.type !== "native" && "assetReference" in feesAsset
    ? feesAsset.assetReference?.toLowerCase()
    : undefined;

/** Celo addresses are hexadecimal, so they compare in any case. */
const isSameAddress = (a: string | undefined, b: string): boolean =>
  a?.toLowerCase() === b.toLowerCase();

type SyncedOperation = {
  id: string;
  hash: string;
  type: OperationTypeLive;
  value: BigNumber;
  senders: string[];
  recipients: string[];
  blockHeight: number;
  blockHash: string;
  accountId: string;
  date: Date;
  hasFailed: boolean;
  fee: BigNumber;
  transactionSequenceNumber: BigNumber | undefined;
  extra: CeloOperationExtra;
  token?: TokenCurrency;
  isSubAccount: boolean;
};

/**
 * One FEES operation of the fee token for each transaction whose fee the account paid in a token
 * (ADR-068): coin-evm leaves the fee out of the token's transfers, so the token history records it
 * here. A token missing from the crypto-assets store gets no operation, as for its transfers.
 */
const buildTokenFeeOperations = async (
  rawOperations: Operation[],
  operations: SyncedOperation[],
  {
    address,
    currency,
    accountId,
  }: { address: string; currency: CryptoCurrency; accountId: string },
): Promise<SyncedOperation[]> => {
  const sources = new Map<string, { item: Operation; feeAsset: string }>();
  for (const item of rawOperations) {
    const feeAsset = readFeeAsset(item.tx.feesAsset);
    if (sources.has(item.tx.hash) || !feeAsset) continue;
    if (isSameAddress(item.tx.feesPayer, address)) sources.set(item.tx.hash, { item, feeAsset });
  }

  const result = await Promise.all(
    [...sources].map(async ([hash, { item, feeAsset }]): Promise<SyncedOperation | undefined> => {
      const token = await getTokenFromAsset(currency, { type: "erc20", assetReference: feeAsset });
      if (!token) {
        log("celo", "fee token not found, its fee is not recorded", { hash });
        return undefined;
      }
      const tokenAccountId = encodeTokenAccountId(accountId, token);
      const fee = new BigNumber(item.tx.fees.toString());
      return {
        id: encodeOperationId(tokenAccountId, hash, "FEES"),
        hash,
        type: "FEES",
        value: fee,
        senders: [address],
        recipients: [],
        blockHeight: item.tx.block.height,
        blockHash: item.tx.block.hash,
        accountId: tokenAccountId,
        date: item.tx.date,
        hasFailed: item.tx.failed,
        fee,
        transactionSequenceNumber: operations.find(op => op.hash === hash)
          ?.transactionSequenceNumber,
        extra: { feeAsset },
        token,
        isSubAccount: true,
      };
    }),
  );
  return result.filter((op): op is SyncedOperation => op !== undefined);
};

const getOperationsList = async ({
  info,
  config,
  accountId,
  contracts,
  api,
}: {
  info: AccountShapeInfo<CeloAccount>;
  config: SyncConfig;
  accountId: string;
  contracts: {
    locked: string;
    election: string;
  };
  api: ReturnType<typeof createApi>;
}): Promise<SyncedOperation[]> => {
  const { address, currency, initialAccount } = info;
  const blacklistedTokenIds = config.blacklistedTokenIds || [];

  const syncHash = await getSyncHash(currency, blacklistedTokenIds);
  const shouldSyncFromScratch =
    syncHash !== initialAccount?.syncHash || initialAccount === undefined;
  const latestSyncedHeight = shouldSyncFromScratch ? 0 : initialAccount.blockHeight;
  const context = buildEvmContext(currency.id);
  const rawOperationsList: Operation[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (
      await (api as any).listOperations(context, address, {
        minHeight: Math.max(latestSyncedHeight - SAFE_REORG_THRESHOLD, 0),
      })
    ).items;

  const operationsList = await Promise.all(
    rawOperationsList.map(async (item): Promise<SyncedOperation> => {
      const token = await getTokenFromAsset(currency, item.asset);
      const type = getTypeFromString(item.type);
      const tokenAccountId = token ? encodeTokenAccountId(accountId, token) : accountId;
      const isSubAccount = token?.ticker !== "CELO" && item.asset.type !== "native";
      const feeAsset = readFeeAsset(item.tx.feesAsset);

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
        transactionSequenceNumber: isSentByAccount(item, address)
          ? toSequenceNumber(item.details?.sequence)
          : undefined,
        // `fee` is in the fee token's units when the fee is not paid in CELO
        extra: feeAsset ? { feeAsset } : {},
        ...(token ? { token } : undefined),
        isSubAccount,
      };

      return operation;
    }),
  );

  const tokenFeeOperations = await buildTokenFeeOperations(rawOperationsList, operationsList, {
    address,
    currency,
    accountId,
  });
  return [...operationsList, ...tokenFeeOperations];
};

const getSubAccounts = async ({
  list,
  blacklistedTokenIds = [],
  accountId,
  info,
}: {
  list: SyncedOperation[];
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
  const evmCtx = buildEvmContext(info.currency.id);
  const config = await evmCtx.config();
  const nodeApi = getNodeApi(config, evmCtx.logger);
  // The FEES operations come after the transfers: newest first, as every history
  const tokensList = Object.values(tokensByKeys).map(item => ({
    ...item,
    operations: [...item.operations].sort((a, b) => b.date.getTime() - a.date.getTime()),
  }));
  const tokensListWithBalance = await Promise.all(
    tokensList.map(async item => {
      const balance = await nodeApi.getTokenBalance(info.address, item.token.contractAddress);

      return {
        ...item,
        balance,
        spendableBalance: balance,
      };
    }),
  );

  return tokensListWithBalance;
};

/**
 * A sub-account rebuilt from scratch keeps what the chain cannot give back. Its stored balance
 * history reference is kept too: the framework regenerates the history only when the reference is
 * unchanged, so a fresh empty one would stay empty.
 */
const keepStoredState = (rebuilt: TokenAccount, stored: TokenAccount[] = []): TokenAccount => {
  const previous = stored.find(sub => sub.id === rebuilt.id);
  return previous
    ? {
        ...rebuilt,
        pendingOperations: previous.pendingOperations,
        balanceHistoryCache: previous.balanceHistoryCache,
      }
    : rebuilt;
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

  const evmCtx = buildEvmContext(currency.id);
  const nodeApi = getNodeApi(configEvm, evmCtx.logger);
  const api = createApi();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blockInfo = await (api as any).lastBlock(evmCtx);
  const balance = await nodeApi.getCoinBalance(address);

  const isTokensEnabled = getEnv("ENABLE_CELO_TOKENS");

  const operationsList = await getOperationsList({
    info,
    config,
    accountId,
    contracts: { locked: lockedGoldAddress, election: electionAddress },
    api,
  });

  const nativeOperations = operationsList.filter(({ isSubAccount }) => !isSubAccount);

  const shouldSyncFromScratch =
    syncHash !== initialAccount?.syncHash || initialAccount === undefined;
  const operations = mergeOps(shouldSyncFromScratch ? [] : oldOperations, nativeOperations);

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

    subAccounts =
      shouldSyncFromScratch && initialAccount?.subAccounts
        ? subAccountsList.map(sub => keepStoredState(sub, initialAccount.subAccounts))
        : (mergeSubAccounts(
            {
              ...initialAccount,
              subAccounts: initialSubAccounts || [],
            } as CeloAccount,
            subAccountsList,
          ) as TokenAccount[]);
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

/**
 * `makeSync` filters only the parent's pending ops, and against the pre-sync account. Filtering
 * against the synced one clears a confirmed op on the sync that brings it in, and token sends
 * with their own nonce no longer replace each other, so their pending ops are pruned here too.
 *
 * `current` is the account when the sync result applies. Its sub-accounts' pending ops are the
 * latest: the synced ones date from the start of the sync, so they miss a token send added or
 * replaced during it.
 */
export const postSync = (current: CeloAccount, synced: CeloAccount): CeloAccount => {
  // Only the account's own transactions carry a nonce, whoever sent their rows: a swap's token IN
  // comes from the pool. A token-only transaction has no parent op, so sub-account ops count too.
  const latestNonce = [
    ...synced.operations,
    ...(synced.subAccounts ?? []).flatMap(sub => sub.operations),
  ]
    .map(o => o.transactionSequenceNumber)
    .reduce<BigNumber | undefined>(
      (max, nonce) => (nonce && (!max || nonce.gt(max)) ? nonce : max),
      undefined,
    );
  const isPending = (owner: AccountLike, op: OperationLive) =>
    !owner.operations.some(o => o.hash === op.hash) &&
    !(latestNonce && op.transactionSequenceNumber?.lte(latestNonce)) &&
    Date.now() - op.date.valueOf() < getEnv("OPERATION_OPTIMISTIC_RETENTION");

  const latestPending = (sub: TokenAccount): OperationLive[] =>
    current.subAccounts?.find(s => s.id === sub.id)?.pendingOperations ?? sub.pendingOperations;

  return {
    ...synced,
    pendingOperations: synced.pendingOperations.filter(op => isPending(synced, op)),
    ...(synced.subAccounts && {
      subAccounts: synced.subAccounts.map(sub => ({
        ...sub,
        pendingOperations: latestPending(sub).filter(op => isPending(sub, op)),
      })),
    }),
  };
};

// `shouldMergeOps: false`: getAccountShape already merges with the stored operations, or drops
// them when the sync hash changes. The outer mergeOps in makeSync would merge the stored ones back,
// and `sameOp` ignores `extra`, so a rebuilt operation would keep its stored extra.
export const sync = makeSync({ getAccountShape, postSync, shouldMergeOps: false });
