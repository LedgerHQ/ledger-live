import getDeviceTransactionConfig from "./deviceTransactionConfig";
import BigNumber from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";

describe("getDeviceTransactionConfig", () => {
  const mockAccount: AccountLike = {
    type: "Account",
    currency: { id: "polkadot", family: "polkadot" },
  } as any;

  it("should return fields for send transaction", async () => {
    const result = await getDeviceTransactionConfig({
      account: mockAccount,
      parentAccount: null,
      transaction: {
        mode: "send",
        useAllAmount: false,
      } as any,
      status: {
        amount: new BigNumber(1000000),
      } as any,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ type: "fees" })]));
  });
});
