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
  if (asset.type === "native" || asset.type === "token") return op.type;

  return "NONE";
}

function computeValue(asset: AssetConfig, op: LiveOperation): bigint {
  if (asset.type === "native" && ["OUT", "FEES"].includes(op.type)) {
    return BigInt(op.value.toFixed(0)) - BigInt(op.fee.toFixed(0));
  }

  // Note: always use the operation's own value here (eg: in the case of a token transfer, the token transfer amount)
  // The operation amount must match the operation asset. If the parent operation additionally contains a native coin
  // transfer, a separate operation will be emitted.
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

// the sort parameter has a double meaning:
// - legacy (for the bridge): it's used to sort the operations in the result list. Explorer always queried in "desc" order.
// - new: it's used to sort AND query the explorer with the correct order.

// the limit parameter is a newly introduced parameter for pagination. It's used to switch between "legacy" and "new" behavior.
// see tests for a full description of the behavior.
export async function listOperations(
  currency: CryptoCurrency,
  address: string,
  pagination: Pagination,
): Promise<[Operation<MemoNotSupported>[], string]> {
  const explorerApi = getExplorerApi(currency);
  const explorerOrder = pagination.limit === undefined ? "desc" : pagination.order ?? "desc";
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
    pagination.minHeight,
    undefined,
    pagination.pagingToken,
    pagination.limit,
    explorerOrder,
  );

  const tokenOrNftHashes = new Set(
    [...lastTokenOperations, ...lastNftOperations].map(op => op.hash),
  );
  const tokenNftOrInternalHashes = new Set(
    [...lastTokenOperations, ...lastNftOperations, ...lastInternalOperations].map(op => op.hash),
  );

  const parents: Record<string, LiveOperation> = {};
  const nativeOperations: Operation<MemoNotSupported>[] = [];

  for (const coinOperation of lastCoinOperations) {
    // Store parent reference for token/NFT/internal operations
    if (tokenNftOrInternalHashes.has(coinOperation.hash)) {
      parents[coinOperation.hash] = coinOperation;
    }

    // Emit native operation only in these cases:
    // 1. No children token/NFT operations (pure native transfer or fees-only) => 1 operation for the native transfer
    // 2. Has associated token/NFT operations but also has native value > 0 => 1 operation for the native transfer in
    //    parent operation, and 1 operation for each child operation
    // As a result:
    //  * in the case of a simple ERC20 transfer, only 1 operation is emitted (still contains fees information in ETH)
    //  * in the example case of a smart contract swap operation with ETH as input and an ERC20 as output, 2 separate
    //    operations are emitted (with duplicate fees information, as it's the same on-chain transaction)
    //  * in the case of a fees-only operation, only 1 operation is emitted with type FEES
    if (!tokenOrNftHashes.has(coinOperation.hash) || !coinOperation.value.isZero()) {
      nativeOperations.push(toOperation(currency.id, address, { type: "native" }, coinOperation));
    }
  }

  const tokenOperations = [...lastTokenOperations, ...lastNftOperations].map<
    Operation<MemoNotSupported>
  >(op => toOperation(currency.id, address, { type: "token", owner: address, parents }, op));
  const internalOperations = lastInternalOperations
    .filter(op => op.hash in parents)
    .map<Operation<MemoNotSupported>>(op => {
      const parent = parents[op.hash];
      return toOperation(
        currency.id,
        address,
        { type: "native", internal: true },
        // Explorers don't provide block hash and fees for internal operations.
        // We take this values from their parent.
        { ...op, fee: parent.fee, blockHash: parent.blockHash },
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

  const isAddressInvolved = (op: Operation<MemoNotSupported>): boolean => {
    // some explorers return addresses with uppercase letters (eg eip-55 encoded addresses)
    const addressLower = address.toLowerCase();
    const isIncluded = (list: string[]): boolean =>
      list.some(item => item.toLowerCase() === addressLower);
    return isIncluded(op.senders) || isIncluded(op.recipients);
  };

  const operations = nativeOperations
    .concat(tokenOperations)
    .concat(internalOperations)
    .filter(hasValidType)
    .filter(isAddressInvolved)
    .sort((a, b) =>
      pagination.order === "asc"
        ? a.tx.date.getTime() - b.tx.date.getTime()
        : b.tx.date.getTime() - a.tx.date.getTime(),
    );

  return [operations, nextPagingToken];
}
