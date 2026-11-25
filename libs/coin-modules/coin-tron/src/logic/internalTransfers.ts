import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { encode58Check } from "../network/format";
import type { TransactionInfoTronAPI } from "../network/types";

/** A value a contract moved during a transaction, as read from the transaction's receipt. */
export type InternalTransfer = {
  /** Position of the transfer in the receipt: stable, so it can identify the transfer. */
  index: number;
  /** Base58 address of the contract that sent the value. */
  from: string;
  /** Base58 address that received the value. */
  to: string;
  amount: bigint;
  /** The TRC10 token moved, when the value is not TRX. */
  tokenId?: string;
};

/**
 * Every value moved by the contracts a transaction called: TRX sent by a contract (a DEX payout,
 * an exchange withdrawal, a refund), or TRC10. They appear in neither the transaction's
 * `raw_data` nor its event logs, only in the receipt's internal transactions.
 *
 * The transaction's own `call_value` is not part of the internal transactions, and a TRC20
 * movement is a contract storage change rather than a value transfer, so neither is listed here.
 * Rejected calls (reverted, nothing they moved is effective) and calls that move nothing are
 * skipped. The caller must not read the receipt of a failed transaction: its revert undoes
 * every internal transfer.
 */
export function readInternalTransfers(
  logger: Logger,
  receipt: Pick<TransactionInfoTronAPI, "id" | "internal_transactions"> | undefined,
): InternalTransfer[] {
  const transfers: InternalTransfer[] = [];
  let index = 0;

  for (const internalTx of receipt?.internal_transactions ?? []) {
    for (const { callValue, tokenId } of internalTx.callValueInfo ?? []) {
      const position = index++;
      if (internalTx.rejected || !callValue) continue;
      if (!Number.isSafeInteger(callValue) || callValue < 0) {
        logger("tron/internalTransfers", "skipping internal transfer with an unreadable amount", {
          txID: receipt?.id,
          internalTxHash: internalTx.hash,
          callValue,
        });
        continue;
      }

      transfers.push({
        index: position,
        from: encode58Check(internalTx.caller_address),
        to: encode58Check(internalTx.transferTo_address),
        amount: BigInt(callValue),
        ...(tokenId ? { tokenId } : {}),
      });
    }
  }

  return transfers;
}
