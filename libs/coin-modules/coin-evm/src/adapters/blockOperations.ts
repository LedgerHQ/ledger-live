import type {
  BlockOperation,
  TransferBlockOperation,
} from "@ledgerhq/coin-framework/api/index";
import { TransactionResponse } from "ethers";
import {
  LedgerExplorerOperation,
  LedgerExplorerERC20TransferEvent,
  LedgerExplorerER721TransferEvent,
  LedgerExplorerER1155TransferEvent,
  LedgerExplorerInternalTransaction,
} from "../types";
import { safeEncodeEIP55 } from "../utils";

/**
 * Extract BlockOperations from an RPC transaction (ethers.js TransactionResponse).
 * This extracts native ETH transfers from the transaction value field.
 */
export function rpcTransactionToBlockOperations(
  tx: TransactionResponse | { from: string | null; to: string | null; value: bigint },
): BlockOperation[] {
  const operations: BlockOperation[] = [];

  if (tx.value && tx.value > 0n) {
    const from = safeEncodeEIP55(tx.from || "");
    const to = safeEncodeEIP55(tx.to || "");

    if (from) {
      const op: TransferBlockOperation = {
        type: "transfer",
        address: from,
        ...(to ? { peer: to } : {}),
        asset: { type: "native" },
        amount: -tx.value,
      };
      operations.push(op);
    }

    if (to) {
      const op: TransferBlockOperation = {
        type: "transfer",
        address: to,
        ...(from ? { peer: from } : {}),
        asset: { type: "native" },
        amount: tx.value,
      };
      operations.push(op);
    }
  }

  return operations;
}

export function ledgerTransactionToBlockOperations(
  ledgerTx: LedgerExplorerOperation,
): BlockOperation[] {
  const operations: BlockOperation[] = [];

  if (ledgerTx.value && BigInt(ledgerTx.value) > 0n) {
    const from = safeEncodeEIP55(ledgerTx.from);
    const to = safeEncodeEIP55(ledgerTx.to);
    const value = BigInt(ledgerTx.value);

    if (from) {
      const op: TransferBlockOperation = {
        type: "transfer",
        address: from,
        ...(to ? { peer: to } : {}),
        asset: { type: "native" },
        amount: -value,
      };
      operations.push(op);
    }

    if (to) {
      const op: TransferBlockOperation = {
        type: "transfer",
        address: to,
        ...(from ? { peer: from } : {}),
        asset: { type: "native" },
        amount: value,
      };
      operations.push(op);
    }
  }

  // Extract ERC20 token transfers
  for (const event of ledgerTx.transfer_events) {
    const from = safeEncodeEIP55(event.from);
    const to = safeEncodeEIP55(event.to);
    const amount = BigInt(event.count);
    const contract = safeEncodeEIP55(event.contract);

    if (from) {
      const op: TransferBlockOperation = {
        type: "transfer",
        address: from,
        ...(to ? { peer: to } : {}),
        asset: { type: "erc20", assetReference: contract },
        amount: -amount,
      };
      operations.push(op);
    }

    if (to) {
      const op: TransferBlockOperation = {
        type: "transfer",
        address: to,
        ...(from ? { peer: from } : {}),
        asset: { type: "erc20", assetReference: contract },
        amount,
      };
      operations.push(op);
    }
  }

  // Extract ERC721 NFT transfers
  for (const event of ledgerTx.erc721_transfer_events) {
    const from = safeEncodeEIP55(event.sender);
    const to = safeEncodeEIP55(event.receiver);
    const contract = safeEncodeEIP55(event.contract);

    if (from) {
      const op: TransferBlockOperation = {
        type: "transfer",
        address: from,
        ...(to ? { peer: to } : {}),
        asset: { type: "erc721", assetReference: contract },
        amount: -1n,
      };
      operations.push(op);
    }

    if (to) {
      const op: TransferBlockOperation = {
        type: "transfer",
        address: to,
        ...(from ? { peer: from } : {}),
        asset: { type: "erc721", assetReference: contract },
        amount: 1n,
      };
      operations.push(op);
    }
  }

  // Extract ERC1155 NFT transfers
  for (const event of ledgerTx.erc1155_transfer_events) {
    const from = safeEncodeEIP55(event.sender);
    const to = safeEncodeEIP55(event.receiver);
    const contract = safeEncodeEIP55(event.contract);

    for (const transfer of event.transfers) {
      const amount = BigInt(transfer.value);

      if (from) {
        const op: TransferBlockOperation = {
          type: "transfer",
          address: from,
          ...(to ? { peer: to } : {}),
          asset: { type: "erc1155", assetReference: contract },
          amount: -amount,
        };
        operations.push(op);
      }

      if (to) {
        const op: TransferBlockOperation = {
          type: "transfer",
          address: to,
          ...(from ? { peer: from } : {}),
          asset: { type: "erc1155", assetReference: contract },
          amount,
        };
        operations.push(op);
      }
    }
  }

  // Extract internal transactions
  for (const action of ledgerTx.actions) {
    if (action.error) {
      continue;
    }

    const from = safeEncodeEIP55(action.from);
    const to = safeEncodeEIP55(action.to);
    const value = BigInt(action.value);

    if (value > 0n) {
      if (from) {
        const op: TransferBlockOperation = {
          type: "transfer",
          address: from,
          ...(to ? { peer: to } : {}),
          asset: { type: "native" },
          amount: -value,
        };
        operations.push(op);
      }

      if (to) {
        const op: TransferBlockOperation = {
          type: "transfer",
          address: to,
          ...(from ? { peer: from } : {}),
          asset: { type: "native" },
          amount: value,
        };
        operations.push(op);
      }
    }
  }

  return operations;
}

