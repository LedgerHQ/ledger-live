import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

describe("getDeviceTransactionConfig", () => {
  const mockAccount: AccountLike = {
    type: "Account",
    currency: {
      units: [{ code: "ALGO", magnitude: 6 }],
    },
  } as any;

  it("should return fields for send transaction", async () => {
    const result = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: {
        mode: "send",
        recipient: "test-address",
      } as any,
      status: {
        amount: new BigNumber(1000000),
        estimatedFees: new BigNumber(1000),
      } as any,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toEqual({ type: "text", label: "Type", value: "Payment" });
  });
});
