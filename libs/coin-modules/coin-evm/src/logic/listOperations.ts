import { AssetInfo, MemoNotSupported, Operation } from "@ledgerhq/coin-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation as LiveOperation, OperationType } from "@ledgerhq/types-live";
import { getExplorerApi } from "../network/explorer";

type AssetConfig =
  | { type: "native" }
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

function computeValue(asset: AssetConfig, op: LiveOperation, type: OperationType): bigint {
  if (type === "FEES") return BigInt(op.fee.toFixed(0));
  if (asset.type === "native" && op.type === "OUT")
    return BigInt(op.value.toFixed(0)) - BigInt(op.fee.toFixed(0));

  return BigInt(op.value.toFixed(0));
}

function toOperation(asset: AssetConfig, op: LiveOperation): Operation<MemoNotSupported> {
  const assetInfo: AssetInfo = { type: asset.type };

  if (asset.type === "token") {
    assetInfo.assetReference = op.contract ?? "";
    assetInfo.assetOwner = asset.owner;
    assetInfo.type = extractStandard(op);
  }

  const type = extractType(asset, op);
  const value = computeValue(asset, op, type);

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
      },
      fees: BigInt(op.fee.toFixed(0)),
      date: op.date,
    },
    details: {
      ledgerOpType: op.type,
      ...(asset.type === "token" ? { assetAmount: op.value.toFixed(0) } : {}),
    },
  };
}

export async function listOperations(
  currency: CryptoCurrency,
  address: string,
  minHeight: number,
): Promise<[Operation<MemoNotSupported>[], string]> {
  const explorerApi = getExplorerApi(currency);
  const { lastCoinOperations, lastTokenOperations, lastNftOperations } =
    await explorerApi.getLastOperations(
      currency,
      address,
      `js:2:${currency.id}:${address}:`,
      minHeight,
    );

  const isNativeOperation = (coinOperation: LiveOperation): boolean =>
    ![...lastTokenOperations, ...lastNftOperations].map(op => op.hash).includes(coinOperation.hash);
  const isTokenOperation = (coinOperation: LiveOperation): boolean =>
    lastTokenOperations.map(op => op.hash).includes(coinOperation.hash);
  const parents = Object.fromEntries(
    lastCoinOperations.filter(isTokenOperation).map(op => [op.hash, op]),
  );

  const nativeOperations = lastCoinOperations
    .filter(isNativeOperation)
    .map<Operation<MemoNotSupported>>(op => toOperation({ type: "native" }, op));
  const tokenOperations = lastTokenOperations.map<Operation<MemoNotSupported>>(op =>
    toOperation({ type: "token", owner: address, parents }, op),
  );

  const hasValidType = (operation: Operation): boolean =>
    ["NONE", "FEES", "IN", "OUT"].includes(operation.type);
  const isAlone = (operation: Operation): boolean =>
    ["NONE", "FEES"].includes(operation.type) && !("assetAmount" in (operation.details ?? {}));

  return [
    nativeOperations.concat(tokenOperations).filter(op => hasValidType(op) && !isAlone(op)),
    "",
  ];
}
