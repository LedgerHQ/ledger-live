/**
 * OperationHistory domain – fetch logic + thunk. Thunk triggers fetch; slice reducers apply payload.
 * Bridge vs Alpaca (listOperations, flattened ops). Supports pagination via options.pagingToken.
 */
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  decodeAccountId,
  decodeTokenAccountIdSync,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/coin-framework/account";
import type { Operation as CoreOperation } from "@ledgerhq/coin-framework/api/types";
// @ts-expect-error subpath may not resolve in web-tools tsconfig
import { getAlpacaApi } from "@ledgerhq/live-common/bridge/generic-alpaca/alpaca";
import { adaptCoreOperationToLiveOperation } from "@ledgerhq/live-common/bridge/generic-alpaca/utils";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { AppDispatch } from "../../store";
import { isAlpacaForAccountId } from "../../shared/syncStrategy";
import { syncAccountViaBridge, splitAccountIntoSliceUpdates } from "../../shared/compatibility";
import type { LoadOperationsOptions, LoadOperationsResult, StoredOperation } from "./schema";

/** Payload for slice: replace (full set) or append (page). Reducers apply this. */
export type OperationHistoryUpdatesPayload =
  | {
      mode: "replace";
      mainAccountId: string;
      operations: StoredOperation[];
      pendingOperations: StoredOperation[];
      nextPagingToken?: string;
      tokenAccountUpdates: {
        accountId: string;
        operations: StoredOperation[];
        pendingOperations: StoredOperation[];
      }[];
    }
  | {
      mode: "append";
      accountId: string;
      operations: StoredOperation[];
      nextPagingToken?: string;
    };

export interface FetchOperationHistoryResult {
  updates: OperationHistoryUpdatesPayload;
  result: LoadOperationsResult;
}

/** Serialize Operation (value/fee BigNumber, date Date) to StoredOperation (value/fee string, date timestamp). */
export function operationToStored(op: Operation): StoredOperation {
  const date =
    op.date instanceof Date ? op.date.getTime() : typeof op.date === "number" ? op.date : 0;
  return {
    ...op,
    value: op.value.toString(),
    fee: op.fee.toString(),
    transactionSequenceNumber: op.transactionSequenceNumber?.toString(),
    date,
  } as StoredOperation;
}

function isNftCoreOp(operation: CoreOperation): boolean {
  return (
    typeof operation.details?.ledgerOpType === "string" &&
    ["NFT_IN", "NFT_OUT"].includes(operation.details?.ledgerOpType)
  );
}

function isIncomingCoreOp(operation: CoreOperation): boolean {
  const type =
    typeof operation.details?.ledgerOpType === "string"
      ? operation.details.ledgerOpType
      : operation.type;
  return type === "IN";
}

function isInternalLiveOp(operation: Operation): boolean {
  return !!(operation.extra as Record<string, unknown>)?.internal;
}

export interface AlpacaOperationsResult {
  accountId: string;
  operations: Account["operations"];
  pendingOperations: Account["pendingOperations"];
  nextPagingToken?: string;
  hasMore: boolean;
  tokenAccountOperations: {
    accountId: string;
    operations: Operation[];
    pendingOperations: Operation[];
  }[];
}

/** Fetch operations via Alpaca API only (no bridge). Returns payload; no dispatch. */
async function fetchOperationsViaAlpaca(
  accountId: string,
  options?: LoadOperationsOptions,
): Promise<AlpacaOperationsResult> {
  const { currencyId, xpubOrAddress: address, derivationMode } = decodeAccountId(accountId);
  const currency = getCryptoCurrencyById(currencyId);
  const alpacaApi = getAlpacaApi(currency.id, "local");

  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const pagination: { minHeight: number; order: "desc"; limit?: number; lastPagingToken?: string } =
    {
      minHeight: 0,
      order: "desc",
    };
  if (options?.limit != null) pagination.limit = options.limit;
  if (options?.pagingToken) pagination.lastPagingToken = options.pagingToken;

  const [balanceRes, [newCoreOps, nextPagingToken]] = await Promise.all([
    alpacaApi.getBalance(address),
    alpacaApi.listOperations(address, pagination),
  ]);
  const hasMore = Boolean(nextPagingToken && nextPagingToken !== "");

  const allTokenAssetsBalances = balanceRes.filter(
    (b: { asset: { type: string } }) => b.asset.type !== "native",
  );

  const newOps: Operation[] = newCoreOps
    .filter((op: CoreOperation) => !isNftCoreOp(op) && (!isIncomingCoreOp(op) || !op.tx.failed))
    .map((op: CoreOperation) => adaptCoreOperationToLiveOperation(id, op))
    .filter((op: Operation) => !isInternalLiveOp(op));

  const flattenedOperations = [...newOps].sort((a, b) => {
    const ta = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
    const tb = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
    return tb - ta;
  });

  /** Map (assetReference, assetOwner) -> tokenId so we can tag ops with tokenId for correct unit in UI. */
  const assetRefToTokenId = new Map<string, string>();
  const tokenAccountOperations: AlpacaOperationsResult["tokenAccountOperations"] = [];
  for (const balance of allTokenAssetsBalances) {
    const asset = balance.asset as { assetReference?: string; assetOwner?: string } | undefined;
    const token = await alpacaApi.getTokenFromAsset?.(balance.asset);
    if (!token) continue;
    const tokenAccountId = encodeTokenAccountId(id, token);
    const assetKey = `${asset?.assetReference ?? ""}\0${asset?.assetOwner ?? ""}`;
    assetRefToTokenId.set(assetKey, token.id);
    const ops = newOps.filter(
      op =>
        (op.extra as Record<string, unknown>)?.assetReference === asset?.assetReference &&
        (op.extra as Record<string, unknown>)?.assetOwner === asset?.assetOwner,
    );
    if (ops.length === 0) continue;
    tokenAccountOperations.push({
      accountId: tokenAccountId,
      operations: ops.map(op => ({
        ...op,
        accountId: tokenAccountId,
        id: `${tokenAccountId}-${op.hash}-${op.type}`,
        tokenId: token.id,
      })),
      pendingOperations: [],
    });
  }

  /** Tag each op with tokenId when it's a token op so UI can use the token's unit for formatting. */
  const flattenedWithTokenId = flattenedOperations.map(op => {
    const extra = op.extra as Record<string, unknown>;
    const assetRef = extra?.assetReference;
    const assetOwner = extra?.assetOwner;
    const assetKey =
      typeof assetRef === "string" || typeof assetOwner === "string"
        ? `${String(assetRef ?? "")}\0${String(assetOwner ?? "")}`
        : null;
    const tokenId = assetKey != null ? assetRefToTokenId.get(assetKey) : undefined;
    if (!tokenId) return op;
    return { ...op, extra: { ...extra, tokenId } };
  });

  return {
    accountId: id,
    operations: flattenedWithTokenId,
    pendingOperations: [],
    nextPagingToken: hasMore ? nextPagingToken : undefined,
    hasMore,
    tokenAccountOperations,
  };
}

function toMainAccountId(accountId: string): string {
  if (accountId.includes("+")) {
    return decodeTokenAccountIdSync(accountId).accountId;
  }
  return accountId;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Fetch operation history. Returns payload for reducers + result (hasMore, nextPagingToken).
 * No dispatch – thunk calls this and slice applies via extraReducers.
 */
export async function fetchOperationHistoryUpdates(
  accountId: string,
  options?: LoadOperationsOptions,
): Promise<FetchOperationHistoryResult> {
  const mainAccountId = toMainAccountId(accountId);
  const isAlpaca = isAlpacaForAccountId(mainAccountId);

  if (isAlpaca) {
    return fetchOperationHistoryViaAlpaca(mainAccountId, options);
  }
  return fetchOperationHistoryViaBridge(mainAccountId);
}

async function fetchOperationHistoryViaAlpaca(
  accountId: string,
  options?: LoadOperationsOptions,
): Promise<FetchOperationHistoryResult> {
  const raw = await fetchOperationsViaAlpaca(accountId, {
    limit: options?.limit ?? (options?.pagingToken ? DEFAULT_PAGE_SIZE : undefined),
    pagingToken: options?.pagingToken,
  });

  const isAppend = Boolean(options?.pagingToken);
  if (isAppend) {
    return {
      updates: {
        mode: "append",
        accountId: raw.accountId,
        operations: raw.operations.map(operationToStored),
        nextPagingToken: raw.nextPagingToken,
      },
      result: { nextPagingToken: raw.nextPagingToken, hasMore: raw.hasMore },
    };
  }
  return {
    updates: {
      mode: "replace",
      mainAccountId: raw.accountId,
      operations: raw.operations.map(operationToStored),
      pendingOperations: raw.pendingOperations.map(operationToStored),
      nextPagingToken: raw.nextPagingToken,
      tokenAccountUpdates: raw.tokenAccountOperations.map(ta => ({
        accountId: ta.accountId,
        operations: ta.operations.map(operationToStored),
        pendingOperations: ta.pendingOperations.map(operationToStored),
      })),
    },
    result: { nextPagingToken: raw.nextPagingToken, hasMore: raw.hasMore },
  };
}

async function fetchOperationHistoryViaBridge(
  accountId: string,
): Promise<FetchOperationHistoryResult> {
  const account = await syncAccountViaBridge(accountId);
  const updates = splitAccountIntoSliceUpdates(account);

  const tokenAccountUpdates = (account.subAccounts ?? [])
    .filter(ta => updates.tokenAccountIds.includes(ta.id))
    .map(ta => {
      const tokenId = ta.token.id;
      const toStored = (op: Account["operations"][0]) => operationToStored({ ...op, tokenId });
      return {
        accountId: ta.id,
        operations: (ta.operations || []).map(toStored),
        pendingOperations: (ta.pendingOperations || []).map(toStored),
      };
    });

  return {
    updates: {
      mode: "replace",
      mainAccountId: account.id,
      operations: updates.operations.map(operationToStored),
      pendingOperations: updates.pendingOperations.map(operationToStored),
      tokenAccountUpdates,
    },
    result: { hasMore: false },
  };
}

export const loadOperationHistory = createAsyncThunk(
  "operationHistory/load",
  (
    { accountId, options }: { accountId: string; options?: LoadOperationsOptions },
    { rejectWithValue },
  ) =>
    fetchOperationHistoryUpdates(accountId, options).catch(e =>
      rejectWithValue(e instanceof Error ? e.message : String(e)),
    ),
);

/** Legacy entry: dispatch thunk and return result (e.g. for balanceHistory orchestration). */
export async function loadOperationHistoryForAccountId(
  accountId: string,
  dispatch: AppDispatch,
  options?: LoadOperationsOptions,
): Promise<LoadOperationsResult> {
  const out = await dispatch(loadOperationHistory({ accountId, options })).unwrap();
  return out.result;
}
