import BigNumber from "bignumber.js";
import { ICP_FEES } from "../consts";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("should create a default transaction with expected fields", () => {
    const tx = createTransaction();
    expect(tx.family).toBe("internet_computer");
    expect(tx.amount).toEqual(new BigNumber(0));
    expect(tx.fees).toEqual(new BigNumber(ICP_FEES));
    expect(tx.recipient).toBe("");
    expect(tx.useAllAmount).toBe(false);
  });
});
