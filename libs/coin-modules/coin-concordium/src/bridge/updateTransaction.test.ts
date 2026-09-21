import BigNumber from "bignumber.js";
import { createFixtureTransaction } from "../test/fixtures";
import { updateTransaction } from "./updateTransaction";

describe("updateTransaction", () => {
  it("should reset fee to null when updating", () => {
    // GIVEN
    const tx = createFixtureTransaction({ fee: new BigNumber(5000) });
    const patch = { recipient: "new-recipient" };

    // WHEN
    const result = updateTransaction(tx, patch);

    // THEN
    expect(result.fee).toBeNull();
  });

  it("should apply patch properties to transaction", () => {
    // GIVEN
    const tx = createFixtureTransaction();
    const patch = { recipient: "new-recipient", amount: new BigNumber(2000000) };

    // WHEN
    const result = updateTransaction(tx, patch);

    // THEN
    expect(result.recipient).toBe("new-recipient");
    expect(result.amount).toEqual(new BigNumber(2000000));
  });

  it("should preserve original transaction properties not in patch", () => {
    // GIVEN
    const tx = createFixtureTransaction({
      amount: new BigNumber(5000000),
      useAllAmount: true,
    });
    const patch = { recipient: "new-recipient" };

    // WHEN
    const result = updateTransaction(tx, patch);

    // THEN
    expect(result.amount).toEqual(new BigNumber(5000000));
    expect(result.useAllAmount).toBe(true);
  });

  it("should handle empty patch", () => {
    // GIVEN
    const tx = createFixtureTransaction();
    const patch = {};

    // WHEN
    const result = updateTransaction(tx, patch);

    // THEN
    expect(result.fee).toBeNull();
    expect(result.amount).toEqual(tx.amount);
  });

  it("should handle memo in patch", () => {
    // GIVEN
    const tx = createFixtureTransaction();
    const patch = { memo: "test memo" };

    // WHEN
    const result = updateTransaction(tx, patch);

    // THEN
    expect(result.memo).toBe("test memo");
    expect(result.fee).toBeNull();
  });

  it("should handle useAllAmount in patch", () => {
    // GIVEN
    const tx = createFixtureTransaction({ useAllAmount: false });
    const patch = { useAllAmount: true };

    // WHEN
    const result = updateTransaction(tx, patch);

    // THEN
    expect(result.useAllAmount).toBe(true);
  });

  // `fee` and `energy` are two halves of one estimate. A leftover energy would
  // be signed as the limit for whatever token the patch selected next, and the
  // device's "Max fees" step would show a figure never estimated for it.
  it("drops the energy alongside the fee", () => {
    // GIVEN
    const tx = createFixtureTransaction({ fee: new BigNumber(3600), energy: 1080 });

    // WHEN
    const result = updateTransaction(tx, { subAccountId: "js:2:concordium:pubkey:+other" });

    // THEN
    expect(result.fee).toBeNull();
    expect("energy" in result).toBe(false);
  });

  it("should return new transaction object (immutable)", () => {
    // GIVEN
    const tx = createFixtureTransaction();
    const patch = { recipient: "new" };

    // WHEN
    const result = updateTransaction(tx, patch);

    // THEN
    expect(result).not.toBe(tx);
  });

  // `useBridgeTransaction` compares by identity, so allocating on a no-op patch
  // flips `bridgePending` and re-runs preparation — a fee round-trip per patch.
  it("keeps the same reference when the patch changes nothing", () => {
    // GIVEN - the fee is already null, so there is nothing left to reset
    const tx = createFixtureTransaction({ fee: null });

    // WHEN
    const result = updateTransaction(tx, {});

    // THEN
    expect(result).toBe(tx);
  });

  it("allocates when there is a stale energy to strip", () => {
    // GIVEN
    const tx = createFixtureTransaction({ fee: null, energy: 1080 });

    // WHEN
    const result = updateTransaction(tx, {});

    // THEN
    expect(result).not.toBe(tx);
    expect("energy" in result).toBe(false);
  });
});
