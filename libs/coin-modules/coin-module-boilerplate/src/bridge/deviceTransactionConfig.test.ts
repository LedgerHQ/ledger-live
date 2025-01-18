import getDeviceTransactionConfig from "./deviceTransactionConfig";
import BigNumber from "bignumber.js";

describe("getDeviceTransactionConfig", () => {
  it("should return amount field when it's more than 0", () => {
    expect(
      getDeviceTransactionConfig({
        transaction: {},
        status: { amount: new BigNumber(1), estimatedFees: new BigNumber(0) },
      } as any)[0],
    ).toEqual({ type: "amount", label: "Amount" });
  });

  it("should return fee field when it's more than 0", () => {
    expect(
      getDeviceTransactionConfig({
        transaction: {},
        status: { amount: new BigNumber(0), estimatedFees: new BigNumber(1) },
      } as any)[0],
    ).toEqual({ type: "fees", label: "Fees" });
  });
});
