import {
  AssetInfo,
  Page,
  MemoNotSupported,
  Operation,
  ListOperationsOptions,
} from "@ledgerhq/coin-framework/api/types";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation as LiveOperation, OperationType } from "@ledgerhq/types-live";
import { getExplorerApi } from "../network/explorer";

type AssetConfig =
  | { type: "native"; internal?: boolean; parent?: LiveOperation }
  | { type: "token"; owner: string; parent?: LiveOperation };

function extractStandard(op: LiveOperation): string {
  if (!op.standard) return "erc20";
  if (["ERC721", "ERC1155"].includes(op.standard)) return op.standard.toLowerCase();

  return "token"; // NOTE: old default
}

function extractType(asset: AssetConfig, op: LiveOperation): OperationType {
  if (asset.type === "native") return op.type;
  return asset.parent?.type || "NONE";
}

function computeValue(asset: AssetConfig, op: LiveOperation): bigint {
  if (asset.type === "native" && ["OUT", "FEES"].includes(op.type)) {
    return BigInt(op.value.toFixed(0)) - BigInt(op.fee.toFixed(0));
  }

  if (asset.type === "token" && asset.parent) {
    return BigInt(asset.parent.value.toFixed(0));
  }

  return BigInt(op.value.toFixed(0));
}

function computeFailed(asset: AssetConfig, op: LiveOperation): boolean {
  if (asset.type === "token") {
    return asset.parent?.hasFailed ?? false;
  }

  return op.hasFailed ?? false;
}

const unambiguousSender = (referenceOperation: LiveOperation | undefined): string | undefined =>
  referenceOperation?.senders?.length === 1 ? referenceOperation?.senders[0] : undefined;

function computeFeesPayer(asset: AssetConfig, op: LiveOperation): string | undefined {
  const isTokenOrInternal = asset.type === "token" || (asset.type === "native" && asset.internal);
  const referenceOperation = isTokenOrInternal ? asset.parent : op;
  return unambiguousSender(referenceOperation);
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
  const feesPayer = computeFeesPayer(asset, op);

  const internalOpDetail =
    asset.type === "native" && asset.internal ? { internal: asset.internal } : {};
  const tokenOpDetail =
    asset.type === "token"
      ? {
          ledgerOpType: op.type,
          assetAmount: op.value.toFixed(0),
          assetSenders: op.senders,
          assetRecipients: op.recipients,
          parentSenders: asset.parent?.senders ?? [],
          parentRecipients: asset.parent?.recipients ?? [],
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
      ...(feesPayer ? { feesPayer } : {}),
    },
    details: {
      sequence: op.transactionSequenceNumber,
      ...internalOpDetail,
      ...tokenOpDetail,
    },
  };
}

// the sort parameter has a double meaning:
// - legacy (for the bridge): it's used to sort the operations in the result list. Explorer always queried in "desc" order.
// - new: it's used to sort AND query the explorer with the correct order.

// the limit parameter is a newly introduced parameter for pagination. It's used to switch between "legacy" and "new" behavior.
// see tests for a full description of the behavior.
export async function listOperations(
  currency: CryptoCurrency,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  const explorerApi = getExplorerApi(currency);
  const explorerOrder = options.limit === undefined ? "desc" : options.order ?? "desc";
  const {
    lastCoinOperations,
    lastTokenOperations,
    lastNftOperations,
    lastInternalOperations,
    nextPagingToken,
  } = await explorerApi.getOperations(
    currency,
    address,
    `js:2:${currency.id}:${address}:`,
    options.minHeight,
    undefined,
    options.cursor,
    options.limit,
    explorerOrder,
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
  >(op =>
    toOperation(
      currency.id,
      address,
      { type: "token", owner: address, parent: parents[op.hash] },
      op,
    ),
  );
  const internalOperations = lastInternalOperations.map<Operation<MemoNotSupported>>(op => {
    // Explorers don't provide block hash and fees for internal operations.
    // When a matching parent transaction exists, we take these values from it.
    // Otherwise, we use the internal operation's defaults.
    const parent = parents[op.hash];
    return toOperation(
      currency.id,
      address,
      { type: "native", internal: true, parent },
      // Explorers don't provide block hash and fees for internal operations.
      // When a parent exists, we take these values from the parent; otherwise keep the internal op values.
      parent ? { ...op, fee: parent.fee, blockHash: parent.blockHash } : op,
    );
  });

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
      options.order === "asc"
        ? a.tx.date.getTime() - b.tx.date.getTime()
        : b.tx.date.getTime() - a.tx.date.getTime(),
    );

  return { items: operations, next: nextPagingToken };
}
