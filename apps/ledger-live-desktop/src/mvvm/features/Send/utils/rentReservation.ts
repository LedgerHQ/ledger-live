import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";

/** Sun per TRX — the rent payment (TX-A) debits native TRX, but the order quotes payCoinAmt in TRX. */
const SUN_PER_TRX = 1_000_000;

const NON_INTEGER_OFFSET = 0.5;

/**
 * Build the pending FEES op that locks the rent payment (TX-A) against the payer's native balance for
 * the two-signature Tronify sponsored send. TX-A is a real TRX debit the payer signs and Tronify
 * broadcasts, but nothing else records it locally: the shared orchestration is platform-agnostic (no
 * redux), and TX-C's own optimistic op is `sponsored:true`, so `getPendingNativeSpent` deliberately
 * skips its fee. Without this the paid TRX stays spendable until the next sync, so a second send could
 * double-spend it and send-max would overcount.
 *
 * Returns null when the inputs can't yield a real reservation (missing id/payer, or a non-finite
 * payCoinAmt) so the caller locks nothing rather than a NaN amount.
 */
export function buildRentReservationOperation({
  mainAccountId,
  payerAddress,
  paymentTxId,
  payCoinAmt,
}: {
  mainAccountId: string;
  payerAddress: string;
  paymentTxId: string;
  payCoinAmt: string | number;
}): Operation | null {
  if (!paymentTxId || !payerAddress) return null;

  // payCoinAmt is TRX and bounded/verified upstream (assertSignableTransferMatchesRequest); a
  // non-finite value here is not a real reservation, so skip rather than lock a NaN amount.
  const reservedSun = new BigNumber(payCoinAmt).times(SUN_PER_TRX);
  if (!reservedSun.isFinite() || reservedSun.isNegative()) return null;

  // Not a chain nonce (TRON has none) but an opaque local dedup key. buildOptimisticOperation stamps
  // sequence 0 on every no-nonce TRON op — including TX-C's own optimistic op — and addPendingOperation
  // dedups by sequence, so a reservation at 0 would evict (and be evicted by) TX-C and any other pending
  // reservation, unlocking the paid TRX. Derive a distinct-per-payment value from the payment tx id's
  // bytes instead. The trailing NON_INTEGER_OFFSET keeps it NON-INTEGER: the generic nonce calc
  // (nextSequenceWithPending) skips non-integer sequences, so this key never leaks into a real send's
  // nonce (TRON's getNextSequence returns 0, so an integer key here would otherwise become the next
  // send's optimistic nonce). It stays > 0 (never collides with the seq-0 ops) and > postSync's -1
  // baseline, so the reservation survives until TX-A's hash appears in operations rather than
  // vanishing on the next sync.
  const reservationSequence = new BigNumber(
    [...paymentTxId].map(ch => (ch.codePointAt(0) ?? 0).toString(16).padStart(4, "0")).join(""),
    16,
  ).plus(NON_INTEGER_OFFSET);

  // A pending FEES op locks exactly `fee` on the native balance (getPendingNativeSpent adds op.fee for
  // a non-sponsored op and no value for a FEES type). No transactionRaw, so it is NOT read as sponsored
  // — that marker is what would skip the lock. hash = TX-A's id so the next sync reconciles it against
  // the real on-chain op and drops the pending entry.
  return {
    id: encodeOperationId(mainAccountId, paymentTxId, "FEES"),
    hash: paymentTxId,
    type: "FEES",
    value: new BigNumber(0),
    fee: reservedSun,
    senders: [payerAddress],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    transactionSequenceNumber: reservationSequence,
    accountId: mainAccountId,
    date: new Date(),
    extra: {},
  };
}
