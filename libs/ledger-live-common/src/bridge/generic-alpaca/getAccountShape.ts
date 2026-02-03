import { encodeAccountId, getSyncHash } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation, cleanedOperation, extractBalance } from "./utils";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization";
import { buildSubAccounts, mergeSubAccounts } from "./buildSubAccounts";
import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/types";
import type { OperationCommon } from "./types";
import type { Account, TokenAccount } from "@ledgerhq/types-live";

function isNftCoreOp(operation: Operation): boolean {
  return (
    typeof operation.details?.ledgerOpType === "string" &&
    ["NFT_IN", "NFT_OUT"].includes(operation.details?.ledgerOpType)
  );
}

function isIncomingCoreOp(operation: Operation): boolean {
  const type =
    typeof operation.details?.ledgerOpType === "string"
      ? operation.details.ledgerOpType
      : operation.type;

  return type === "IN";
}

function isInternalLiveOp(operation: OperationCommon): boolean {
  return !!operation.extra?.internal;
}

/** True when the op is a main-account (native) op, not a token/sub-account op */
function isNativeLiveOp(operation: OperationCommon): boolean {
  return !operation.extra?.assetReference;
}

/**
 * Emit one parent operation per tx hash so the account has a single top-level op per tx
 * (e.g. pure ERC20 shows one FEES op with token subOp, not FEES + token as two top-level ops).
 * - If the hash has a native op: use it as parent and attach subOperations.
 * - If the hash has only token ops: create a synthetic FEES parent and attach token ops as subOperations.
 */
function buildOneParentOpPerHash(
  newSubAccounts: TokenAccount[],
  newNonInternalOperations: OperationCommon[],
  newInternalOperations: OperationCommon[],
  accountId: string,
): OperationCommon[] {
  const seenHashes = new Set<string>();
  const result: OperationCommon[] = [];

  for (const op of newNonInternalOperations) {
    if (seenHashes.has(op.hash)) continue;
    seenHashes.add(op.hash);

    const transactionOps = newNonInternalOperations.filter(o => o.hash === op.hash);
    const nativeOp = transactionOps.find(isNativeLiveOp);
    const subOperations = inferSubOperations(op.hash, newSubAccounts);
    const internalOperations = newInternalOperations.filter(it => it.hash === op.hash);

    if (nativeOp) {
      result.push(
        cleanedOperation({
          ...nativeOp,
          subOperations,
          internalOperations,
        }),
      );
    } else {
      const firstOp = transactionOps[0];
      result.push(
        cleanedOperation({
          id: encodeOperationId(accountId, firstOp.hash, "FEES"),
          hash: firstOp.hash,
          accountId,
          type: "FEES",
          value: firstOp.fee,
          fee: firstOp.fee,
          blockHash: firstOp.blockHash,
          blockHeight: firstOp.blockHeight,
          senders: firstOp.senders,
          recipients: firstOp.recipients,
          date: firstOp.date,
          transactionSequenceNumber: firstOp.transactionSequenceNumber,
          hasFailed: firstOp.hasFailed,
          extra: {},
          subOperations,
          internalOperations,
        }),
      );
    }
  }

  return result;
}

export function genericGetAccountShape(network: string, kind: string): GetAccountShape {
  return async (info, syncConfig) => {
    const { address, initialAccount, currency, derivationMode } = info;
    const alpacaApi = getAlpacaApi(currency.id, kind);

    if (alpacaApi.getChainSpecificRules) {
      const chainSpecificValidation = alpacaApi.getChainSpecificRules();
      if (chainSpecificValidation.getAccountShape) {
        chainSpecificValidation.getAccountShape(address);
      }
    }

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: address,
      derivationMode,
    });

    const blockInfo = await alpacaApi.lastBlock();
    const balanceRes = await alpacaApi.getBalance(address);
    const nativeAsset = extractBalance(balanceRes, "native");

    const allTokenAssetsBalances = balanceRes.filter(b => b.asset.type !== "native");
    const nativeBalance = BigInt(nativeAsset?.value ?? "0");

    const spendableBalance = BigInt(nativeBalance - BigInt(nativeAsset?.locked ?? "0"));

    // Normalize pre-alpaca operations to the new accountId to keep UI rendering consistent
    const oldOps = ((initialAccount?.operations || []) as OperationCommon[]).map(op =>
      op.accountId === accountId
        ? op
        : { ...op, accountId, id: encodeOperationId(accountId, op.hash, op.type) },
    );
    const lastPagingToken = oldOps[0]?.extra?.pagingToken || "";
    const syncHash = await getSyncHash(currency.id, syncConfig.blacklistedTokenIds);
    const syncFromScratch = !initialAccount?.blockHeight || initialAccount?.syncHash !== syncHash;

    // Calculate minHeight for pagination
    const minHeight = syncFromScratch ? 0 : (oldOps[0]?.blockHeight ?? 0) + 1;
    const paginationParams: Pagination = { minHeight, order: "desc" };
    if (lastPagingToken && !syncFromScratch) {
      paginationParams.lastPagingToken = lastPagingToken;
    }

    const [newCoreOps] = await alpacaApi.listOperations(address, paginationParams);
    const newOps = newCoreOps
      .filter(op => !isNftCoreOp(op) && (!isIncomingCoreOp(op) || !op.tx.failed))
      .map(op => adaptCoreOperationToLiveOperation(accountId, op)) as OperationCommon[];

    const newAssetOperations = newOps.filter(
      operation =>
        operation?.extra?.assetReference &&
        operation?.extra?.assetOwner &&
        !["OPT_IN", "OPT_OUT"].includes(operation.type),
    );

    const newInternalOperations: OperationCommon[] = [];
    const newNonInternalOperations: OperationCommon[] = [];
    for (const op of newOps) {
      if (isInternalLiveOp(op)) newInternalOperations.push(op);
      else newNonInternalOperations.push(op);
    }

    const newSubAccounts = await buildSubAccounts({
      accountId,
      allTokenAssetsBalances,
      syncConfig,
      operations: newAssetOperations,
      getTokenFromAsset: alpacaApi.getTokenFromAsset,
    });
    const subAccounts = syncFromScratch
      ? newSubAccounts
      : mergeSubAccounts(initialAccount?.subAccounts ?? [], newSubAccounts);

    const newOpsWithSubs = buildOneParentOpPerHash(
      newSubAccounts,
      newNonInternalOperations,
      newInternalOperations,
      accountId,
    );
    // Try to refresh known pending and broadcasted operations (if not already updated)
    // Useful for integrations without explorers
    const operationsToRefresh = initialAccount?.pendingOperations.filter(
      pendingOp =>
        pendingOp.hash && // operation has been broadcasted
        !newOpsWithSubs.some(newOp => pendingOp.hash === newOp.hash), // operation is not confirmed yet
    );
    const confirmedOperations =
      alpacaApi.refreshOperations && operationsToRefresh?.length
        ? await alpacaApi.refreshOperations(operationsToRefresh)
        : [];
    const newOperations = [...confirmedOperations, ...newOpsWithSubs];
    const operations = mergeOps(syncFromScratch ? [] : oldOps, newOperations) as OperationCommon[];

    const res: Partial<Account> = {
      id: accountId,
      xpub: address,
      blockHeight: operations.length === 0 ? 0 : blockInfo.height || initialAccount?.blockHeight,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations,
      subAccounts,
      operationsCount: operations.length,
      syncHash,
    };
    return res;
  };
}
