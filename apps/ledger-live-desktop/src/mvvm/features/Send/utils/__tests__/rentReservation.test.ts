import BigNumber from "bignumber.js";
import { buildRentReservationOperation } from "../rentReservation";

const MAIN_ID = "js:2:tron:TPARENT:";
const PAYER = "TPAYER0000000000000000000000000000";

describe("buildRentReservationOperation", () => {
  it("locks payCoinAmt TRX as a pending FEES op on the main account", () => {
    const op = buildRentReservationOperation({
      mainAccountId: MAIN_ID,
      payerAddress: PAYER,
      paymentTxId: "txA-hash-1",
      payCoinAmt: "12.5",
    });
    if (!op) throw new Error("expected an operation");

    expect(op.type).toBe("FEES");
    expect(op.accountId).toBe(MAIN_ID);
    expect(op.hash).toBe("txA-hash-1");
    expect(op.senders).toEqual([PAYER]);
    // value 0 — a FEES op contributes only its fee.
    expect(op.fee.toString()).toBe("12500000");
    expect(op.value.toString()).toBe("0");
    // No transactionRaw, so getPendingNativeSpent does NOT treat it as sponsored and locks the fee.
    expect(op.transactionRaw).toBeUndefined();
    // A defined, non-zero sequence: > postSync's -1 baseline so it is retained across a sync, but
    // never 0 — the value buildOptimisticOperation stamps on TX-C's own op, which addPendingOperation
    // would then dedup against this reservation.
    expect(op.transactionSequenceNumber).toBeDefined();
    expect(op.transactionSequenceNumber?.isZero()).toBe(false);
    // ...and NON-INTEGER: nextSequenceWithPending skips non-integer sequences, so this dedup key never
    // leaks into a real send's nonce (TRON's getNextSequence returns 0, so an integer here would become
    // the next send's optimistic nonce).
    expect(op.transactionSequenceNumber?.isInteger()).toBe(false);
  });

  it("derives a distinct, non-zero, deterministic sequence per payment tx id", () => {
    const reserve = (paymentTxId: string) =>
      buildRentReservationOperation({
        mainAccountId: MAIN_ID,
        payerAddress: PAYER,
        paymentTxId,
        payCoinAmt: "1",
      });
    const opA = reserve("a1b2c3d4e5f6");
    const opB = reserve("f6e5d4c3b2a1");
    const opASame = reserve("a1b2c3d4e5f6");
    if (!opA || !opB || !opASame) throw new Error("expected operations");

    // addPendingOperation dedups by sequence, so two payments must get two sequences (equal ones evict
    // each other) and neither may be the seq-0 the TRON optimistic ops carry. The same id must map back
    // to the same sequence so a rebuilt reservation replaces itself instead of stacking.
    expect(opA.transactionSequenceNumber?.isZero()).toBe(false);
    expect(opA.transactionSequenceNumber?.eq(opB.transactionSequenceNumber as BigNumber)).toBe(
      false,
    );
    expect(opA.transactionSequenceNumber?.eq(opASame.transactionSequenceNumber as BigNumber)).toBe(
      true,
    );
  });

  it("derives a finite, non-zero, deterministic sequence for a real 64-char TRON tx id", () => {
    // A TRON txID is a 64-char hex hash; the earlier cases use short ids, so pin the real length.
    const txId = "a".repeat(63) + "b";
    const other = "a".repeat(63) + "c";
    const op = buildRentReservationOperation({
      mainAccountId: MAIN_ID,
      payerAddress: PAYER,
      paymentTxId: txId,
      payCoinAmt: "1",
    });
    const opSame = buildRentReservationOperation({
      mainAccountId: MAIN_ID,
      payerAddress: PAYER,
      paymentTxId: txId,
      payCoinAmt: "1",
    });
    const opOther = buildRentReservationOperation({
      mainAccountId: MAIN_ID,
      payerAddress: PAYER,
      paymentTxId: other,
      payCoinAmt: "1",
    });
    if (!op || !opSame || !opOther) throw new Error("expected operations");

    const seq = op.transactionSequenceNumber as BigNumber;
    expect(seq.isFinite()).toBe(true); // never NaN/Infinity from the base-16 parse
    expect(seq.isZero()).toBe(false);
    expect(seq.isInteger()).toBe(false); // excluded from nextSequenceWithPending even at full txid length
    expect(seq.eq(opSame.transactionSequenceNumber as BigNumber)).toBe(true);
    expect(seq.eq(opOther.transactionSequenceNumber as BigNumber)).toBe(false);
  });

  it("returns null when paymentTxId is missing", () => {
    expect(
      buildRentReservationOperation({
        mainAccountId: MAIN_ID,
        payerAddress: PAYER,
        paymentTxId: "",
        payCoinAmt: "12.5",
      }),
    ).toBeNull();
  });

  it("returns null when payerAddress is missing", () => {
    expect(
      buildRentReservationOperation({
        mainAccountId: MAIN_ID,
        payerAddress: "",
        paymentTxId: "txA-hash-1",
        payCoinAmt: "12.5",
      }),
    ).toBeNull();
  });

  it("returns null for a non-finite payCoinAmt", () => {
    expect(
      buildRentReservationOperation({
        mainAccountId: MAIN_ID,
        payerAddress: PAYER,
        paymentTxId: "txA-hash-1",
        payCoinAmt: "not-a-number",
      }),
    ).toBeNull();
  });

  it("returns null for a negative payCoinAmt", () => {
    expect(
      buildRentReservationOperation({
        mainAccountId: MAIN_ID,
        payerAddress: PAYER,
        paymentTxId: "txA-hash-1",
        payCoinAmt: "-1",
      }),
    ).toBeNull();
  });
});
