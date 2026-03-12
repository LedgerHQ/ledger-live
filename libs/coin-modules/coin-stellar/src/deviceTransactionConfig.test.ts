import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

describe("getDeviceTransactionConfig", () => {
  const baseParams = {
    account: {} as any,
    parentAccount: null,
    transaction: {} as any,
  };

  it("returns network and memo by default", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      status: {
        amount: new BigNumber(0),
        estimatedFees: new BigNumber(0),
      } as any,
    });

    expect(fields).toEqual([
      { type: "stellar.network", label: "Network" },
      { type: "stellar.memo", label: "Memo" },
    ]);
  });

  it("adds amount and fees fields when non-zero", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      status: {
        amount: new BigNumber(1000),
        estimatedFees: new BigNumber(100),
      } as any,
    });

    expect(fields).toEqual([
      { type: "stellar.network", label: "Network" },
      { type: "amount", label: "Amount" },
      { type: "stellar.memo", label: "Memo" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("adds asset fields when asset reference and owner are provided", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: {
        assetReference: "USDC",
        assetOwner: "GISSUER",
      } as any,
      status: {
        amount: new BigNumber(1),
        estimatedFees: new BigNumber(0),
      } as any,
    });

    expect(fields).toEqual([
      { type: "stellar.network", label: "Network" },
      { type: "amount", label: "Amount" },
      { type: "stellar.assetCode", label: "Asset" },
      { type: "stellar.assetIssuer", label: "Asset issuer" },
      { type: "stellar.memo", label: "Memo" },
    ]);
  });

  it("does not add asset fields when asset owner is missing", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: {
        assetReference: "USDC",
      } as any,
      status: {
        amount: new BigNumber(1),
        estimatedFees: undefined,
      } as any,
    });

    expect(fields).toEqual([
      { type: "stellar.network", label: "Network" },
      { type: "amount", label: "Amount" },
      { type: "stellar.memo", label: "Memo" },
    ]);
  });
});
