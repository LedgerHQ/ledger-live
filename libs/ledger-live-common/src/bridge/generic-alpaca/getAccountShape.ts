import { encodeAccountId, getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation, cleanedOperation, extractBalance } from "./utils";
import { inferSubOperations } from "@ledgerhq/ledger-wallet-framework/serialization";
import { buildSubAccounts, mergeSubAccounts } from "./buildSubAccounts";
import type {
  BlockOperation,
  BlockTransaction,
  Operation,
} from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { OperationCommon } from "./types";
import type { Account } from "@ledgerhq/types-live";

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

function toBigNumberSequence(sequence: unknown): BigNumber | undefined {
  if (typeof sequence === "bigint") return new BigNumber(sequence.toString());
  if (typeof sequence === "number") return new BigNumber(sequence);
  if (typeof sequence === "string" && sequence.length > 0) return new BigNumber(sequence);
  return undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function sanitizeHexData(value: unknown): string | undefined {
  const data = toNonEmptyString(value);
  if (!data) return undefined;
  return data.startsWith("0x") ? data.slice(2) : data;
}

function buildEvmPendingTransactionRaw({
  currency,
  tx,
  op,
  isOutgoing,
}: {
  currency: CryptoCurrency;
  tx: BlockTransaction;
  op: Extract<BlockOperation, { type: "transfer" }>;
  isOutgoing: boolean;
}): OperationCommon["transactionRaw"] | undefined {
  if (currency.family !== "evm" || !isOutgoing) {
    return undefined;
  }

  const details = tx.details ?? {};
  const nonce = toNumber(details.nonce ?? details.sequence);
  const gasLimit = toNonEmptyString(details.gasLimit);
  const recipient = toNonEmptyString(details.recipient) ?? op.peer;
  const amount =
    toNonEmptyString(details.value) ?? (op.amount < 0n ? (-op.amount).toString() : "0");
  const chainId = currency.ethereumLikeInfo?.chainId;

  if (nonce === undefined || !gasLimit || !recipient || chainId === undefined) {
    return undefined;
  }

  const type = toNumber(details.type);
  const data = sanitizeHexData(details.data);
  const common = {
    family: "evm",
    mode: "send",
    amount,
    recipient,
    useAllAmount: false,
    nonce,
    gasLimit,
    chainId,
    feesStrategy: "medium" as const,
    ...(data ? { data } : {}),
  };

  const maxFeePerGas = toNonEmptyString(details.maxFeePerGas);
  const maxPriorityFeePerGas = toNonEmptyString(details.maxPriorityFeePerGas);
  if (type === 2 && maxFeePerGas && maxPriorityFeePerGas) {
    const eip1559Raw = {
      ...common,
      type: 2,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
    return eip1559Raw;
  }

  const gasPrice = toNonEmptyString(details.gasPrice) ?? "0";
  const legacyRaw = {
    ...common,
    type: type === 1 ? 1 : 0,
    gasPrice,
  };
  return legacyRaw;
}

function transferOperationToPendingLiveOperation(
  currency: CryptoCurrency,
  accountId: string,
  tx: BlockTransaction,
  op: BlockOperation,
  index: number,
): OperationCommon | null {
  if (op.type !== "transfer") return null;

  const isOutgoing = op.amount < 0n;
  const value = isOutgoing ? -op.amount : op.amount;
  const sequence = toBigNumberSequence(tx.details?.sequence);
  const operationType = isOutgoing ? "OUT" : "IN";
  const operationId = `${encodeOperationId(accountId, tx.hash, operationType)}:${index}`;
  const operationValue = isOutgoing && op.asset.type === "native" ? value + tx.fees : value;
  const transactionRaw = buildEvmPendingTransactionRaw({ currency, tx, op, isOutgoing });

  return {
    id: operationId,
    hash: tx.hash,
    accountId,
    type: operationType,
    value: new BigNumber(operationValue.toString()),
    fee: new BigNumber(tx.fees.toString()),
    blockHash: null,
    blockHeight: null,
    senders: isOutgoing ? [op.address] : op.peer ? [op.peer] : [],
    recipients: isOutgoing ? (op.peer ? [op.peer] : []) : [op.address],
    date: new Date(),
    transactionSequenceNumber: sequence,
    hasFailed: tx.failed,
    ...(transactionRaw ? { transactionRaw } : {}),
    extra: { pending: true },
  };
}

function pendingTransactionsToOperations(
  currency: CryptoCurrency,
  accountId: string,
  address: string,
  transactions: BlockTransaction[],
): OperationCommon[] {
  const normalizedAddress = address.toLowerCase();
  const operations: OperationCommon[] = [];

  for (const tx of transactions) {
    tx.operations.forEach((op, index) => {
      if (op.type !== "transfer" || op.address.toLowerCase() !== normalizedAddress) return;
      const pendingOperation = transferOperationToPendingLiveOperation(
        currency,
        accountId,
        tx,
        op,
        index,
      );
      if (pendingOperation) operations.push(pendingOperation);
    });
  }

  return operations;
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
    const cursor = oldOps[0]?.extra?.pagingToken || "";
    const syncHash = await getSyncHash(currency.id, syncConfig.blacklistedTokenIds);
    const syncFromScratch = !initialAccount?.blockHeight || initialAccount?.syncHash !== syncHash;

    // Calculate minHeight for pagination
    const minHeight = syncFromScratch ? 0 : (oldOps[0]?.blockHeight ?? 0) + 1;
    const paginationCursor = cursor && !syncFromScratch ? cursor : undefined;

    const { items: newCoreOps } = await alpacaApi.listOperations(address, {
      minHeight,
      cursor: paginationCursor,
      order: "desc",
    });
    const newOps = newCoreOps
      .filter(op => !isNftCoreOp(op) && (!isIncomingCoreOp(op) || !op.tx.failed))
      .map(op => adaptCoreOperationToLiveOperation(accountId, op)) as OperationCommon[];

    const newAssetOperations = newOps.filter(
      operation =>
        operation?.extra?.assetReference &&
        operation?.extra?.assetOwner &&
        !["OPT_IN", "OPT_OUT"].includes(operation.type),
    );
    const newInternalOperations = newOps.filter(isInternalLiveOp);
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

    const newOpsWithSubs = newOps
      .filter(operation => !isInternalLiveOp(operation))
      .map(op => {
        const subOperations = inferSubOperations(op.hash, newSubAccounts);
        const internalOperations = newInternalOperations.filter(it => it.hash === op.hash);

        return cleanedOperation({
          ...op,
          subOperations,
          internalOperations,
        });
      });
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
    const pendingCoreTxs = alpacaApi.getPendingTransactions
      ? (await alpacaApi.getPendingTransactions(address)).items
      : [];
    const pendingOperations = pendingTransactionsToOperations(
      currency,
      accountId,
      address,
      pendingCoreTxs,
    );

    const res: Partial<Account> = {
      id: accountId,
      xpub: address,
      blockHeight: operations.length === 0 ? 0 : blockInfo.height || initialAccount?.blockHeight,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations,
      pendingOperations,
      subAccounts,
      operationsCount: operations.length,
      syncHash,
    };
    return res;
  };
}
