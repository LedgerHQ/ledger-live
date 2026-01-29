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

  it("should return new transaction object (immutable)", () => {
    // GIVEN
    const tx = createFixtureTransaction();
    const patch = { recipient: "new" };

    // WHEN
    const result = updateTransaction(tx, patch);

    // THEN
    expect(result).not.toBe(tx);
  });
});
