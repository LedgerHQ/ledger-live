/* eslint-disable @typescript-eslint/consistent-type-assertions */
import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

describe("getDeviceTransactionConfig", () => {
  const baseParams = {
    account: {} as any,
    parentAccount: null,
  };

  it("shows a plain Transfer method with amount and fees for a send", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: {} as any,
      status: { amount: new BigNumber(1), estimatedFees: new BigNumber(10) } as any,
    });

    expect(fields).toEqual([
      { type: "text", label: "Method", value: "Transfer" },
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("shows Transfer All when useAllAmount is set", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: { useAllAmount: true } as any,
      status: { amount: new BigNumber(1), estimatedFees: new BigNumber(0) } as any,
    });

    expect(fields).toEqual([
      { type: "text", label: "Method", value: "Transfer All" },
      { type: "amount", label: "Amount" },
    ]);
  });

  it("shows Associate Token with no amount field for changeTrust", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: { mode: "changeTrust" } as any,
      status: { amount: new BigNumber(0), estimatedFees: new BigNumber(5) } as any,
    });

    expect(fields).toEqual([
      { type: "text", label: "Method", value: "Associate Token" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it.each([
    ["delegate", "Delegate"],
    ["undelegate", "Undelegate"],
    ["redelegate", "Redelegate"],
    ["claimReward", "Claim Rewards"],
  ])("shows the %s staking method plus fees and staked node id", async (mode, label) => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: { mode, valId: "3" } as any,
      status: { amount: new BigNumber(0), estimatedFees: new BigNumber(10) } as any,
    });

    expect(fields).toEqual([
      { type: "text", label: "Method", value: label },
      { type: "fees", label: "Fees" },
      { type: "text", label: "Staked Node ID", value: "3" },
    ]);
  });

  it("omits the Staked Node ID field when valId is absent (undelegate to a node the account is leaving)", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: { mode: "undelegate" } as any,
      status: { amount: new BigNumber(0), estimatedFees: new BigNumber(0) } as any,
    });

    expect(fields).toEqual([{ type: "text", label: "Method", value: "Undelegate" }]);
  });
});
