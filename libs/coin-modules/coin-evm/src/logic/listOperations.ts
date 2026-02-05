import {
  AssetInfo,
  MemoNotSupported,
  Operation,
  Pagination,
} from "@ledgerhq/coin-framework/api/types";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation as LiveOperation, OperationType } from "@ledgerhq/types-live";
import { getExplorerApi } from "../network/explorer";

type AssetConfig =
  | { type: "native"; internal?: boolean }
  | { type: "token"; owner: string; parents: Record<string, LiveOperation> };

function extractStandard(op: LiveOperation): string {
  if (!op.standard) return "erc20";
  if (["ERC721", "ERC1155"].includes(op.standard)) return op.standard.toLowerCase();

  return "token"; // NOTE: old default
}

function extractType(asset: AssetConfig, op: LiveOperation): OperationType {
  if (asset.type === "native") return op.type;
  if (op.hash in asset.parents) return asset.parents[op.hash].type;

  return "NONE";
}

function computeValue(asset: AssetConfig, op: LiveOperation): bigint {
  if (asset.type === "native" && ["OUT", "FEES"].includes(op.type)) {
    return BigInt(op.value.toFixed(0)) - BigInt(op.fee.toFixed(0));
  }

  if (asset.type === "token" && op.hash in asset.parents) {
    return BigInt(asset.parents[op.hash].value.toFixed(0));
  }

  return BigInt(op.value.toFixed(0));
}

function computeFailed(asset: AssetConfig, op: LiveOperation): boolean {
  if (asset.type === "token" && op.hash in asset.parents) {
    return asset.parents[op.hash].hasFailed ?? false;
  }

  return op.hasFailed ?? false;
}

function toOperation(
  currency: string,
  address: string,
  asset: AssetConfig,
  op: LiveOperation,
): Operation<MemoNotSupported> {
  if (op.value.isNaN() || op.fee.isNaN()) {
    log("evm/listOperations", "Found NaN value on operation", {
      currency,
      address,
      operation: op.hash,
      assetType: asset.type,
      assetIsInternal: asset.type === "native" && !!asset.internal,
      ...(op.contract ? { assetReference: op.contract } : {}),
    });
  }

  const assetInfo: AssetInfo = { type: asset.type };

  if (asset.type === "token") {
    assetInfo.assetReference = op.contract ?? "";
    assetInfo.assetOwner = asset.owner;
    assetInfo.type = extractStandard(op);
  }

  const type = extractType(asset, op);
  const value = computeValue(asset, op);
  const failed = computeFailed(asset, op);

  const internalOpDetail =
    asset.type === "native" && asset.internal ? { internal: asset.internal } : {};
  const tokenOpDetail =
    asset.type === "token"
      ? {
          ledgerOpType: op.type,
          assetAmount: op.value.toFixed(0),
          assetSenders: op.senders,
          assetRecipients: op.recipients,
          parentSenders: asset.parents[op.hash]?.senders ?? [],
          parentRecipients: asset.parents[op.hash]?.recipients ?? [],
        }
      : {};

  return {
    id: op.id,
    type,
    senders: op.senders,
    recipients: op.recipients,
    value,
    asset: assetInfo,
    tx: {
      hash: op.hash,
      block: {
        height: op.blockHeight ?? 0,
        hash: op.blockHash ?? "",
        time: op.date,
      },
      fees: BigInt(op.fee.toFixed(0)),
      date: op.date,
      failed,
    },
    details: {
      sequence: op.transactionSequenceNumber,
      ...internalOpDetail,
      ...tokenOpDetail,
    },
  };
}

export async function listOperations(
  currency: CryptoCurrency,
  address: string,
  pagination: Pagination,
): Promise<[Operation<MemoNotSupported>[], string]> {
  const explorerApi = getExplorerApi(currency);
  const { lastCoinOperations, lastTokenOperations, lastNftOperations, lastInternalOperations } =
    await explorerApi.getLastOperations(
      currency,
      address,
      `js:2:${currency.id}:${address}:`,
      pagination.minHeight,
    );

  const isNativeOperation = (coinOperation: LiveOperation): boolean =>
    ![...lastTokenOperations, ...lastNftOperations].map(op => op.hash).includes(coinOperation.hash);
  const isTokenOrInternalOperation = (coinOperation: LiveOperation): boolean =>
    [...lastTokenOperations, ...lastNftOperations, ...lastInternalOperations]
      .map(op => op.hash)
      .includes(coinOperation.hash);

  const parents: Record<string, LiveOperation> = {};
  const nativeOperations: Operation<MemoNotSupported>[] = [];

  for (const coinOperation of lastCoinOperations) {
    if (isTokenOrInternalOperation(coinOperation)) {
      parents[coinOperation.hash] = coinOperation;
    }

    if (isNativeOperation(coinOperation)) {
      nativeOperations.push(toOperation(currency.id, address, { type: "native" }, coinOperation));
    }
  }

  const tokenOperations = [...lastTokenOperations, ...lastNftOperations].map<
    Operation<MemoNotSupported>
  >(op => toOperation(currency.id, address, { type: "token", owner: address, parents }, op));
  const internalOperations = lastInternalOperations
    .filter(op => op.hash in parents)
    .map<Operation<MemoNotSupported>>(op =>
      toOperation(
        currency.id,
        address,
        { type: "native", internal: true },
        // Explorers don't provide block hash and fees for internal operations.
        // We take this values from their parent.
        { ...op, fee: parents[op.hash].fee, blockHash: parents[op.hash].blockHash },
      ),
    );

  const hasValidType = (operation: Operation): boolean =>
    [
      "NONE",
      "FEES",
      "IN",
      "OUT",
      "DELEGATE",
      "UNDELEGATE",
      "REDELEGATE",
      "NFT_IN",
      "NFT_OUT",
    ].includes(operation.type);

  const operations = nativeOperations
    .concat(tokenOperations)
    .concat(internalOperations)
    .filter(hasValidType)
    .sort((a, b) =>
      pagination.order === "asc"
        ? a.tx.date.getTime() - b.tx.date.getTime()
        : b.tx.date.getTime() - a.tx.date.getTime(),
    );

  return [operations, ""];
}
