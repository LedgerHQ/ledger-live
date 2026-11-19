import type {
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { getBlockTransactionEvents } from "../../network/proxyClient";
import { toCanonicalAddresses } from "../account/canonicalAddress";
import type {
  BlockTransactionSummary,
  TransactionEvent,
  ConcordiumEventAddress,
  TransferMemoEvent,
  TransferredEvent,
  ConcordiumCoinConfig,
} from "../../types";
import { getBlockInfo } from "./getBlockInfo";
import { decodeMemo } from "./memo";

const NATIVE_ASSET = { type: "native" } as const;

/**
 * Returns a full block (info + transactions) for a given height.
 * `info` reuses the getBlockInfo logic (height → hash → info); transactions come
 * from the per-block events endpoint and are mapped tag-by-tag.
 *
 * Events name the alias each party used on chain. Every account address is
 * replaced by the canonical address of its account, as `listOperations` names
 * the queried account, so a client tracking an account matches all its aliases.
 */
export async function getBlock(
  config: ConcordiumCoinConfig,
  height: number,
  currencyId: string,
): Promise<Block> {
  const info = await getBlockInfo(config, height, currencyId);
  const summaries = await getBlockTransactionEvents(config, currencyId, info.hash);
  const transactions = summaries.map(toBlockTransaction);
  const canonical = await toCanonicalAddresses(
    config,
    currencyId,
    transactions.flatMap(addressesOf),
  );

  return {
    info,
    transactions: transactions.map(tx => withAddresses(tx, canonical)),
  };
}

function addressesOf(tx: BlockTransaction): string[] {
  return [
    ...(tx.feesPayer ? [tx.feesPayer] : []),
    ...tx.operations.flatMap(op =>
      op.type === "transfer" ? [op.address, ...(op.peer ? [op.peer] : [])] : [],
    ),
  ];
}

function withAddresses(tx: BlockTransaction, canonical: Map<string, string>): BlockTransaction {
  const to = (address: string) => canonical.get(address) ?? address;
  return {
    ...tx,
    ...(tx.feesPayer ? { feesPayer: to(tx.feesPayer) } : {}),
    operations: tx.operations.map(op =>
      op.type === "transfer"
        ? { ...op, address: to(op.address), ...(op.peer ? { peer: to(op.peer) } : {}) }
        : op,
    ),
  };
}

function toBlockTransaction(summary: BlockTransactionSummary): BlockTransaction {
  const { operations, memo } =
    summary.result.outcome === "success"
      ? mapEventsToOperations(summary.result.events, summary.hash)
      : { operations: [] as BlockOperation[], memo: undefined };

  // The sender's `cost` is 0 when a sponsor paid; the sponsor's share is then the whole cost.
  const sponsor = summary.sponsorDetails;
  const feesPayer = sponsor ? sponsor.sponsor : summary.sender;

  return {
    hash: summary.hash,
    failed: summary.result.outcome === "reject",
    fees: BigInt(sponsor ? sponsor.cost : summary.cost),
    ...(feesPayer ? { feesPayer } : {}),
    operations,
    ...(memo ? { details: { memo } } : {}),
  };
}

function mapEventsToOperations(
  events: TransactionEvent[],
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

const isTransferredEvent = (event: TransactionEvent): event is TransferredEvent =>
  event.tag === "Transferred";

const isTransferMemoEvent = (event: TransactionEvent): event is TransferMemoEvent =>
  event.tag === "TransferMemo";
