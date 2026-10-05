import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { buildRentReservationOperation } from "../rentReservation";

const TOKEN_ID = "js:2:tron:TPARENT:+tron%2Ftrc20%2Ftr7nhqjekqxgtci8q8zy4pl8otszgjlj6t";
const PAYER = "TPAYER0000000000000000000000000000";

const reserve = (overrides: Partial<Parameters<typeof buildRentReservationOperation>[0]> = {}) =>
  buildRentReservationOperation({
    tokenAccountId: TOKEN_ID,
    payerAddress: PAYER,
    paymentTxId: "txA-hash-1",
    rentAmount: 3_200_000n,
    reservationSequence: "123.5",
    ...overrides,
  });

describe("buildRentReservationOperation", () => {
  it("locks the rent as the value of a fee-less pending OUT op on the fee-token sub-account", () => {
    const op = reserve();
    if (!op) throw new Error("expected an operation");

    expect(op.type).toBe("OUT");
    expect(op.id).toBe(encodeOperationId(TOKEN_ID, "txA-hash-1", "OUT"));
    expect(op.accountId).toBe(TOKEN_ID);
    expect(op.hash).toBe("txA-hash-1");
    expect(op.senders).toEqual([PAYER]);
    expect(op.value.toString()).toBe("3200000");
    expect(op.fee.toString()).toBe("0");
    expect(op.transactionRaw).toBeUndefined();
  });

  it("uses the seam-provided dedup key as the sequence", () => {
    expect(reserve()?.transactionSequenceNumber?.toString()).toBe("123.5");
  });

  it.each([
    ["paymentTxId is missing", { paymentTxId: "" }],
    ["payerAddress is missing", { payerAddress: "" }],
    ["the rent is negative", { rentAmount: -1n }],
    ["the rent is zero", { rentAmount: 0n }],
    ["the dedup key is not a number", { reservationSequence: "not-a-number" }],
  ])("returns null when %s", (_, overrides) => {
    expect(reserve(overrides)).toBeNull();
  });
});
