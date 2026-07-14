import type { Transaction } from "../../generated/types";
import { isAleoTransaction } from "./utils";

describe("isAleoTransaction", () => {
  it("returns true for an aleo transaction", () => {
    const transaction = { family: "aleo" } as unknown as Transaction;
    expect(isAleoTransaction(transaction)).toBe(true);
  });

  it("returns false for a non-aleo transaction", () => {
    const transaction = { family: "bitcoin" } as unknown as Transaction;
    expect(isAleoTransaction(transaction)).toBe(false);
  });
});
