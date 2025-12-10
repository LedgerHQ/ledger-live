import { createMockCantonAccount } from "../test/fixtures";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("should create a 0 amount transaction", () => {
    expect(createTransaction(createMockCantonAccount()).amount.toNumber()).toEqual(0);
  });

  it("should create a transaction with canton family", () => {
    expect(createTransaction(createMockCantonAccount()).family).toEqual("canton");
  });
});
