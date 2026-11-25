import type {
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { getBlockTransactionEvents } from "../../network/proxyClient";
import type {
  BalanceEvent,
  BlockTransactionSummary,
  TransactionEvent,
  ConcordiumEventAddress,
  TransferMemoEvent,
  ConcordiumCoinConfig,
} from "../../types";
import { getBlockInfo } from "./getBlockInfo";
import { decodeMemo } from "./memo";

const NATIVE_ASSET = { type: "native" } as const;

/** CCD that left `from` for `to`; a side that is a contract or a shielded balance is absent. */
interface Movement {
  from?: ConcordiumEventAddress;
  to?: ConcordiumEventAddress;
  amount: bigint;
}

/**
 * Returns a full block (info + transactions) for a given height.
 * `info` reuses the getBlockInfo logic (height → hash → info); transactions come
 * from the per-block events endpoint and are mapped tag-by-tag.
 */
export async function getBlock(
  config: ConcordiumCoinConfig,
  height: number,
  currencyId: string,
): Promise<Block> {
  const info = await getBlockInfo(config, height, currencyId);
  const summaries = await getBlockTransactionEvents(config, currencyId, info.hash);

  return {
    info,
    transactions: summaries.map(toBlockTransaction),
  };
}

function toBlockTransaction(summary: BlockTransactionSummary): BlockTransaction {
  const { operations, memo } =
    summary.result.outcome === "success"
      ? mapEventsToOperations(summary.result.events, summary)
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
  { hash, sender }: BlockTransactionSummary,
): { operations: BlockOperation[]; memo: string | undefined } {
  const movements: Movement[] = [];
  let memo: string | undefined;

  // Tag-based dispatch; unknown tags (e.g. PLT, staking) intentionally emit no operations yet.
  for (const event of events) {
    if (isBalanceEvent(event)) {
      movements.push(movementOf(event, sender));
    } else if (isTransferMemoEvent(event)) {
      memo = decodeMemo(event.memo, hash);
    }
  }

  return { operations: toTransferOperations(movements), memo };
}

function toTransferOperations(movements: Movement[]): BlockOperation[] {
  const operations: BlockOperation[] = [];
  // As in listOperations, CCD that a contract pays back is netted against what it was sent.
  const netOfContracts = new Map<string, bigint>();
  const addToNet = (address: string, amount: bigint) =>
    netOfContracts.set(address, (netOfContracts.get(address) ?? 0n) + amount);

  for (const { amount, ...parties } of movements) {
    const from = accountAddress(parties.from);
    const to = accountAddress(parties.to);

    if (from && to) {
      operations.push(nativeTransfer(from, -amount, to), nativeTransfer(to, amount, from));
    } else if (from) {
      addToNet(from, -amount);
    } else if (to) {
      addToNet(to, amount);
    }
  }

  for (const [address, amount] of netOfContracts) {
    if (amount !== 0n) operations.push(nativeTransfer(address, amount));
  }

  return operations;
}

function movementOf(event: BalanceEvent, sender: string | null): Movement {
  switch (event.tag) {
    case "Transferred":
      return { from: event.from, to: event.to, amount: BigInt(event.amount) };
    case "TransferredWithSchedule":
      return {
        from: accountParty(event.from),
        to: accountParty(event.to),
        amount: event.amount.reduce((sum, [, amount]) => sum + BigInt(amount), 0n),
      };
    case "Updated":
      return { from: event.instigator, amount: BigInt(event.amount) };
    case "ContractInitialized":
      return {
        ...(sender ? { from: accountParty(sender) } : {}),
        amount: BigInt(event.amount),
      };
    case "EncryptedSelfAmountAdded":
      return { from: accountParty(event.account), amount: BigInt(event.amount) };
    case "AmountAddedByDecryption":
      return { to: accountParty(event.account), amount: BigInt(event.amount) };
  }
}

function nativeTransfer(address: string, amount: bigint, peer?: string): BlockOperation {
  return {
    type: "transfer",
    address,
    ...(peer ? { peer } : {}),
    asset: NATIVE_ASSET,
    amount,
  };
}

function accountParty(address: string): ConcordiumEventAddress {
  return { type: "AddressAccount", address };
}

function accountAddress(party: ConcordiumEventAddress | undefined): string | undefined {
  return party?.type === "AddressAccount" ? party.address : undefined;
}

const BALANCE_EVENT_TAGS: ReadonlySet<string> = new Set<BalanceEvent["tag"]>([
  "Transferred",
  "TransferredWithSchedule",
  "Updated",
  "ContractInitialized",
  "EncryptedSelfAmountAdded",
  "AmountAddedByDecryption",
]);

const isBalanceEvent = (event: TransactionEvent): event is BalanceEvent =>
  BALANCE_EVENT_TAGS.has(event.tag);

const isTransferMemoEvent = (event: TransactionEvent): event is TransferMemoEvent =>
  event.tag === "TransferMemo";
