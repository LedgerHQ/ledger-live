import type {
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { getBlockTransactionEvents } from "../../network/proxyClient";
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
 * replaced by the canonical address of its account, which the proxy returns
 * with the events, so a client tracking an account matches all its aliases.
 */
export async function getBlock(
  config: ConcordiumCoinConfig,
  height: number,
  currencyId: string,
): Promise<Block> {
  const info = await getBlockInfo(config, height, currencyId);
  const summaries = await getBlockTransactionEvents(config, currencyId, info.hash);

  return { info, transactions: summaries.map(toBlockTransaction) };
}

/**
 * An older proxy ignores `canonicalAddresses=y`: failing beats reporting
 * aliases, which a client would silently fail to match.
 */
function canonicalAddressesOf(summary: BlockTransactionSummary): Record<string, string> {
  if (!summary.canonicalAddresses) {
    throw new Error(
      `Concordium proxy returned no canonical addresses for transaction ${summary.hash}`,
    );
  }
  return summary.canonicalAddresses;
}

function toBlockTransaction(summary: BlockTransactionSummary): BlockTransaction {
  const canonicalAddresses = canonicalAddressesOf(summary);
  // Absent for an address with no account in the block, e.g. in a reject reason.
  const canonical = (address: string) => canonicalAddresses[address] ?? address;

  const { operations, memo } =
    summary.result.outcome === "success"
      ? mapEventsToOperations(summary.result.events, summary.hash, canonical)
      : { operations: [] as BlockOperation[], memo: undefined };

  // The sender's `cost` is 0 when a sponsor paid; the sponsor's share is then the whole cost.
  const sponsor = summary.sponsorDetails;
  const feesPayer = sponsor ? sponsor.sponsor : summary.sender;

  return {
    hash: summary.hash,
    failed: summary.result.outcome === "reject",
    fees: BigInt(sponsor ? sponsor.cost : summary.cost),
    ...(feesPayer ? { feesPayer: canonical(feesPayer) } : {}),
    operations,
    ...(memo ? { details: { memo } } : {}),
  };
}

function mapEventsToOperations(
  events: TransactionEvent[],
  txHash: string,
  canonical: (address: string) => string,
): { operations: BlockOperation[]; memo: string | undefined } {
  const operations: BlockOperation[] = [];
  let memo: string | undefined;

  // Tag-based dispatch; unknown tags (e.g. PLT, staking) intentionally emit no operations yet.
  for (const event of events) {
    if (isTransferredEvent(event)) {
      operations.push(...toTransferOperations(event, canonical));
    } else if (isTransferMemoEvent(event)) {
      memo = decodeMemo(event.memo, txHash);
    }
  }

  return { operations, memo };
}

function toTransferOperations(
  event: TransferredEvent,
  canonical: (address: string) => string,
): BlockOperation[] {
  const from = accountAddress(event.from, canonical);
  const to = accountAddress(event.to, canonical);
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

function accountAddress(
  address: ConcordiumEventAddress,
  canonical: (address: string) => string,
): string | undefined {
  return address.type === "AddressAccount" ? canonical(address.address) : undefined;
}

const isTransferredEvent = (event: TransactionEvent): event is TransferredEvent =>
  event.tag === "Transferred";

const isTransferMemoEvent = (event: TransactionEvent): event is TransferMemoEvent =>
  event.tag === "TransferMemo";
