import type { AssetInfo, TransactionEvent } from "@ledgerhq/coin-framework/api/index";
import { LedgerExplorerOperation } from "../types";
import { safeEncodeEIP55 } from "../utils";

/**
 * Helper function to add transfer events for a from/to pair.
 * Creates two events: one for the sender (negative amount) and one for the receiver (positive amount).
 */
function addTransferEvent(
  events: TransactionEvent[],
  from: string | undefined,
  to: string | undefined,
  asset: AssetInfo,
  amount: bigint,
): void {
  const encodedFrom = from ? safeEncodeEIP55(from) : undefined;
  const encodedTo = to ? safeEncodeEIP55(to) : undefined;

  events.push({
    type: "TRANSFER",
    balanceDeltas: [
      ...(encodedFrom ? [{ address: encodedFrom, peer: encodedTo, asset, delta: -amount }] : []),
      ...(encodedTo ? [{ address: encodedTo, peer: encodedFrom, asset, delta: amount }] : []),
    ],
  });
}

function addFeeEvent(events: TransactionEvent[], from: string, fees: bigint): void {
  const encodedFrom = safeEncodeEIP55(from);

  events.push({
    type: "FEE",
    balanceDeltas: [{ address: encodedFrom, asset: { type: "native" }, delta: -fees }],
  });
}

/**
 * Extract BlockOperations from an RPC transaction (ethers.js TransactionResponse).
 * This extracts native ETH transfers from the transaction value field.
 */
export function rpcTransactionToBlockOperations(
  from: string,
  to: string | undefined,
  value: bigint,
  fees: bigint,
): TransactionEvent[] {
  const events: TransactionEvent[] = [];

  if (value && value > 0n) {
    addTransferEvent(events, from, to, { type: "native" }, value);
  }

  addFeeEvent(events, from, fees);

  return events;
}

export function ledgerTransactionToBlockOperations(
  ledgerTx: LedgerExplorerOperation,
): TransactionEvent[] {
  const events: TransactionEvent[] = [];

  if (ledgerTx.value && BigInt(ledgerTx.value) > 0n) {
    addTransferEvent(
      events,
      ledgerTx.from,
      ledgerTx.to,
      { type: "native" },
      BigInt(ledgerTx.value),
    );
  }

  // Extract ERC20 token transfers
  for (const event of ledgerTx.transfer_events) {
    const contract = safeEncodeEIP55(event.contract);
    addTransferEvent(
      events,
      event.from,
      event.to,
      { type: "erc20", assetReference: contract },
      BigInt(event.count),
    );
  }

  // Extract ERC721 NFT transfers
  for (const event of ledgerTx.erc721_transfer_events) {
    const contract = safeEncodeEIP55(event.contract);
    addTransferEvent(
      events,
      event.sender,
      event.receiver,
      { type: "erc721", assetReference: contract },
      1n,
    );
  }

  // Extract ERC1155 NFT transfers
  for (const event of ledgerTx.erc1155_transfer_events) {
    const contract = safeEncodeEIP55(event.contract);

    for (const transfer of event.transfers) {
      addTransferEvent(
        events,
        event.sender,
        event.receiver,
        { type: "erc1155", assetReference: contract },
        BigInt(transfer.value),
      );
    }
  }

  // Extract internal transactions
  for (const action of ledgerTx.actions) {
    if (action.error) {
      continue;
    }

    const value = BigInt(action.value);
    if (value > 0n) {
      addTransferEvent(events, action.from, action.to, { type: "native" }, value);
    }
  }

  addFeeEvent(events, ledgerTx.from, BigInt(ledgerTx.gas_used) * BigInt(ledgerTx.gas_price));

  return events;
}
