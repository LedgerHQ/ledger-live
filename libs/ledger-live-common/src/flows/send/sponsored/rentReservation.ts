import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";

/** Pending OUT op locking the TX-A rent on the payer's fee-token sub-account until sync: the
 * provider broadcasts TX-A, so nothing else records it locally. */
export function buildRentReservationOperation({
  tokenAccountId,
  payerAddress,
  paymentTxId,
  rentAmount,
  reservationSequence,
}: {
  tokenAccountId: string;
  payerAddress: string;
  paymentTxId: string;
  rentAmount: bigint;
  reservationSequence: string;
}): Operation | null {
  if (!paymentTxId || !payerAddress) return null;

  const rent = new BigNumber(rentAmount.toString());
  if (rent.lte(0)) return null;

  // addPendingOperation dedups by sequence, so this must not collide with TX-C's optimistic op.
  const sequence = new BigNumber(reservationSequence);
  if (!sequence.isFinite()) return null;

  return {
    id: encodeOperationId(tokenAccountId, paymentTxId, "OUT"),
    hash: paymentTxId,
    type: "OUT",
    value: rent,
    fee: new BigNumber(0),
    senders: [payerAddress],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    transactionSequenceNumber: sequence,
    accountId: tokenAccountId,
    date: new Date(),
    extra: {},
  };
}
