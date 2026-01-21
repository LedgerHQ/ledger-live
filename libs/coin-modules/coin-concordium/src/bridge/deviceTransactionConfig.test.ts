import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

describe("getDeviceTransactionConfig", () => {
  it("should return amount field when it's more than 0", async () => {
    const result = await getDeviceTransactionConfig({
      transaction: {},
      status: { amount: new BigNumber(1), estimatedFees: new BigNumber(0) },
    } as any);
    expect(result[0]).toEqual({ type: "amount", label: "Amount" });
  });

  it("should return fee field when it's more than 0", async () => {
    const result = await getDeviceTransactionConfig({
      transaction: {},
      status: { amount: new BigNumber(0), estimatedFees: new BigNumber(1) },
    } as any);
    expect(result[0]).toEqual({ type: "fees", label: "Fees" });
  });

  it("should include memo field when memo is present", async () => {
    const result = await getDeviceTransactionConfig({
      transaction: { memo: "Test memo" },
      status: { amount: new BigNumber(1), estimatedFees: new BigNumber(1) },
    } as any);
    expect(result).toContainEqual({ type: "text", label: "Memo", value: "Test memo" });
  });

  it("should not include memo field when memo is not present", async () => {
    const result = await getDeviceTransactionConfig({
      transaction: {},
      status: { amount: new BigNumber(1), estimatedFees: new BigNumber(1) },
    } as any);
    const memoField = result.find(field => field.label === "Memo");
    expect(memoField).toBeUndefined();
  });
});
