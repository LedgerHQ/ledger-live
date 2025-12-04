import type {
  AssetInfo,
  BlockOperation,
  TransferBlockOperation,
} from "@ledgerhq/coin-framework/api/index";
import { LedgerExplorerOperation } from "../types";
import { safeEncodeEIP55 } from "../utils";

/**
 * Helper function to add transfer operations for a from/to pair.
 * Creates two operations: one for the sender (negative amount) and one for the receiver (positive amount).
 */
function addTransferOperations(
  operations: BlockOperation[],
  from: string | null,
  to: string | undefined,
  asset: AssetInfo,
  amount: bigint,
): void {
  const encodedFrom = from ? safeEncodeEIP55(from) : "";
  const encodedTo = to ? safeEncodeEIP55(to) : "";

  if (encodedFrom) {
    const op: TransferBlockOperation = {
      type: "transfer",
      address: encodedFrom,
      ...(encodedTo ? { peer: encodedTo } : {}),
      asset,
      amount: -amount,
    };
    operations.push(op);
  }

  if (encodedTo) {
    const op: TransferBlockOperation = {
      type: "transfer",
      address: encodedTo,
      ...(encodedFrom ? { peer: encodedFrom } : {}),
      asset,
      amount,
    };
    operations.push(op);
  }
}

/**
 * Extract BlockOperations from an RPC transaction (ethers.js TransactionResponse).
 * This extracts native ETH transfers from the transaction value field.
 */
export function rpcTransactionToBlockOperations(
  from: string,
  value: bigint,
  to: string | undefined,
): BlockOperation[] {
  const operations: BlockOperation[] = [];

  if (value && value > 0n) {
    addTransferOperations(operations, from, to, { type: "native" }, value);
  }

  return operations;
}

export function ledgerTransactionToBlockOperations(
  ledgerTx: LedgerExplorerOperation,
): BlockOperation[] {
  const operations: BlockOperation[] = [];

  if (ledgerTx.value && BigInt(ledgerTx.value) > 0n) {
    addTransferOperations(
      operations,
      ledgerTx.from,
      ledgerTx.to,
      { type: "native" },
      BigInt(ledgerTx.value),
    );
  }

  // Extract ERC20 token transfers
  for (const event of ledgerTx.transfer_events) {
    const contract = safeEncodeEIP55(event.contract);
    addTransferOperations(
      operations,
      event.from,
      event.to,
      { type: "erc20", assetReference: contract },
      BigInt(event.count),
    );
  }

  // Extract ERC721 NFT transfers
  for (const event of ledgerTx.erc721_transfer_events) {
    const contract = safeEncodeEIP55(event.contract);
    addTransferOperations(
      operations,
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
      addTransferOperations(
        operations,
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
      addTransferOperations(operations, action.from, action.to, { type: "native" }, value);
    }
  }

  return operations;
}
