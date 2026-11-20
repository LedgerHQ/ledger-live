import type { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import getMemoValue from "../getMemoValue";
import cosmosFamily from "../index";

const makeTransaction = (memoValue: string | null | undefined): Transaction =>
  ({ family: "cosmos", memoValue }) as Transaction;

describe("cosmos getMemoValue", () => {
  it("returns the memo value", () => {
    expect(getMemoValue(makeTransaction("Cosmos memo"))).toBe("Cosmos memo");
  });

  it.each([null, undefined])("returns undefined when the memo value is %s", memoValue => {
    expect(getMemoValue(makeTransaction(memoValue))).toBeUndefined();
  });

  it("is exposed through the cosmos family contract", () => {
    expect(cosmosFamily.getMemoValue).toBe(getMemoValue);
  });
});
