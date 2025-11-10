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

function computeValue(asset: AssetConfig, op: LiveOperation): bigint {
  if (asset.type === "native" && ["OUT", "FEES"].includes(op.type)) {
    return BigInt(op.value.toFixed(0)) - BigInt(op.fee.toFixed(0));
  }

  if (asset.type === "token" && op.hash in asset.parents) {
    return BigInt(asset.parents[op.hash].value.toFixed(0));
  }

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
  const value = computeValue(asset, op);

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
      failed: op.hasFailed ?? false,
    },
    details: {
      sequence: op.transactionSequenceNumber,
      status: op.hasFailed ? "failed" : "success",
      ...(asset.type === "token"
        ? {
            ledgerOpType: op.type,
            assetAmount: op.value.toFixed(0),
            assetSenders: op.senders,
            assetRecipients: op.recipients,
            parentSenders: asset.parents[op.hash]?.senders ?? [],
            parentRecipients: asset.parents[op.hash]?.recipients ?? [],
          }
        : {}),
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
    [...lastTokenOperations, ...lastNftOperations].map(op => op.hash).includes(coinOperation.hash);
  const parents = Object.fromEntries(
    lastCoinOperations.filter(isTokenOperation).map(op => [op.hash, op]),
  );

  const nativeOperations = lastCoinOperations
    .filter(isNativeOperation)
    .map<Operation<MemoNotSupported>>(op => toOperation({ type: "native" }, op));
  const tokenOperations = [...lastTokenOperations, ...lastNftOperations].map<
    Operation<MemoNotSupported>
  >(op => toOperation({ type: "token", owner: address, parents }, op));

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

  return [nativeOperations.concat(tokenOperations).filter(hasValidType), ""];
}
