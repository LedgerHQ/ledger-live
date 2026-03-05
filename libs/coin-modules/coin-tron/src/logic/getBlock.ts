import type {
  AssetInfo,
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-framework/api/index";
import { getBlock as networkGetBlock, toBlock } from "../network";
import { formatTrongridTxResponse } from "../network/format";
import type { BlockTransactionAPI, TransactionTronAPI } from "../network/types";
import type { TrongridTxInfo } from "../types";

export async function getBlockInfo(height: number): Promise<BlockInfo> {
  if (height <= 0) {
    return { height, hash: "", time: new Date(0) };
  }

  const data = await networkGetBlock(height);
  const block = toBlock(data);
  return {
    height: block.height,
    hash: block.hash,
    time: block.time ?? new Date(0),
  };
}

export async function getBlock(height: number): Promise<Block> {
  if (height <= 0) {
    return { info: { height, hash: "", time: new Date(0) }, transactions: [] };
  }

  const data = await networkGetBlock(height, true);
  const header = data.block_header.raw_data;
  const blockTimestamp = header.timestamp ?? 0;

  const info: BlockInfo = {
    height: header.number ?? height,
    hash: data.blockID,
    time: blockTimestamp ? new Date(blockTimestamp) : new Date(0),
  };

  if (header.parentHash && height > 0) {
    info.parent = { height: height - 1, hash: header.parentHash };
  }

  const transactions: BlockTransaction[] = (data.transactions ?? [])
    .map(tx => toBlockTransaction(tx, blockTimestamp, height))
    .filter((tx): tx is BlockTransaction => tx !== null);

  return { info, transactions };
}

function toBlockTransaction(
  tx: BlockTransactionAPI,
  blockTimestamp: number,
  blockHeight: number,
): BlockTransaction | null {
  const augmentedTx = {
    ...tx,
    block_timestamp: blockTimestamp,
    blockNumber: blockHeight,
  } as TransactionTronAPI;

  const txInfo = formatTrongridTxResponse(augmentedTx);
  if (!txInfo) return null;

  return {
    hash: txInfo.txID,
    failed: txInfo.hasFailed,
    fees: BigInt(txInfo.fee?.toFixed(0) ?? "0"),
    feesPayer: txInfo.from,
    operations: toBlockOperations(txInfo),
  };
}

function toBlockOperations(txInfo: TrongridTxInfo): BlockOperation[] {
  const asset = inferAsset(txInfo);

  if (isTransfer(txInfo) && txInfo.to && txInfo.value) {
    const amount = BigInt(txInfo.value.toFixed(0));
    return [
      { type: "transfer", address: txInfo.from, peer: txInfo.to, asset, amount: -amount },
      { type: "transfer", address: txInfo.to, peer: txInfo.from, asset, amount },
    ];
  }

  return [{ type: "other", contractType: txInfo.type }];
}

function isTransfer(txInfo: TrongridTxInfo): boolean {
  return (
    txInfo.type === "TransferContract" ||
    txInfo.type === "TransferAssetContract" ||
    (txInfo.type === "TriggerSmartContract" && txInfo.tokenType === "trc20")
  );
}

function inferAsset(txInfo: TrongridTxInfo): AssetInfo {
  if (txInfo.tokenType === "trc10" && txInfo.tokenId) {
    return { type: "trc10", assetReference: txInfo.tokenId };
  }
  if (txInfo.tokenType === "trc20" && txInfo.tokenAddress) {
    return { type: "trc20", assetReference: txInfo.tokenAddress };
  }
  return { type: "native" };
}
