import type {
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { getBlockTransactionEvents } from "../../network/proxyClient";
import type {
  BlockTransactionEvent,
  BlockTransactionSummary,
  ConcordiumEventAddress,
  TransferMemoEvent,
  TransferredEvent,
} from "../../types";
import { getBlockInfo } from "./getBlockInfo";
import { decodeMemo } from "./memo";

const NATIVE_ASSET = { type: "native" } as const;

/**
 * Returns a full block (info + transactions) for a given height.
 * `info` reuses the getBlockInfo logic (height → hash → info); transactions come
 * from the per-block events endpoint and are mapped tag-by-tag.
 */
export async function getBlock(height: number, currencyId: string): Promise<Block> {
  const info = await getBlockInfo(height, currencyId);
  const summaries = await getBlockTransactionEvents(currencyId, info.hash);

  return {
    info,
    transactions: summaries.map(toBlockTransaction),
  };
}

function toBlockTransaction(summary: BlockTransactionSummary): BlockTransaction {
  const { operations, memo } =
    summary.result.outcome === "success"
      ? mapEventsToOperations(summary.result.events, summary.hash)
      : { operations: [] as BlockOperation[], memo: undefined };

  return {
    hash: summary.hash,
    failed: summary.result.outcome === "reject",
    fees: BigInt(summary.cost),
    ...(summary.sender ? { feesPayer: summary.sender } : {}),
    operations,
    ...(memo ? { details: { memo } } : {}),
  };
}

function mapEventsToOperations(
  events: BlockTransactionEvent[],
  txHash: string,
): { operations: BlockOperation[]; memo: string | undefined } {
  const operations: BlockOperation[] = [];
  let memo: string | undefined;

  // Tag-based dispatch; unknown tags (e.g. PLT, staking) intentionally emit no operations yet.
  for (const event of events) {
    if (isTransferredEvent(event)) {
      operations.push(...toTransferOperations(event));
    } else if (isTransferMemoEvent(event)) {
      memo = decodeMemo(event.memo, txHash);
    }
  }

  return { operations, memo };
}

function toTransferOperations(event: TransferredEvent): BlockOperation[] {
  const from = accountAddress(event.from);
  const to = accountAddress(event.to);
  const amount = BigInt(event.amount);

  const operations: BlockOperation[] = [];
  if (from) {
    operations.push({
      type: "transfer",
      address: from,
      ...(to ? { peer: to } : {}),
      asset: NATIVE_ASSET,
      amount: -amount,
    });
  }
  if (to) {
    operations.push({
      type: "transfer",
      address: to,
      ...(from ? { peer: from } : {}),
      asset: NATIVE_ASSET,
      amount,
    });
  }
  return operations;
}

function accountAddress(address: ConcordiumEventAddress): string | undefined {
  return address.type === "AddressAccount" ? address.address : undefined;
}

const isTransferredEvent = (event: BlockTransactionEvent): event is TransferredEvent =>
  event.tag === "Transferred";

const isTransferMemoEvent = (event: BlockTransactionEvent): event is TransferMemoEvent =>
  event.tag === "TransferMemo";
