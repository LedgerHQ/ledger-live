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

  it("shows Associate Token with no amount field for tokenAssociate", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: { mode: "tokenAssociate" } as any,
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

  it("shows a Memo row for a send carrying a memo", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: { memoValue: "ref-42" } as any,
      status: { amount: new BigNumber(1), estimatedFees: new BigNumber(0) } as any,
    });

    expect(fields).toEqual([
      { type: "text", label: "Method", value: "Transfer" },
      { type: "amount", label: "Amount" },
      { type: "text", label: "Memo", value: "ref-42" },
    ]);
  });

  it("shows a Memo row for a staking transaction carrying its mode's default memo", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: { mode: "delegate", valId: "3", memoValue: "Stake" } as any,
      status: { amount: new BigNumber(0), estimatedFees: new BigNumber(10) } as any,
    });

    expect(fields).toEqual([
      { type: "text", label: "Method", value: "Delegate" },
      { type: "fees", label: "Fees" },
      { type: "text", label: "Staked Node ID", value: "3" },
      { type: "text", label: "Memo", value: "Stake" },
    ]);
  });

  it("shows a Gas Limit row for an ERC20 send carrying a gasLimit", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: { gasLimit: new BigNumber(123456) } as any,
      status: { amount: new BigNumber(1), estimatedFees: new BigNumber(10) } as any,
    });

    expect(fields).toEqual([
      { type: "text", label: "Method", value: "Transfer" },
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
      { type: "text", label: "Gas Limit", value: "123456" },
    ]);
  });

  it("omits the Gas Limit row for tokenAssociate even if a stale gasLimit is present", async () => {
    const fields = await getDeviceTransactionConfig({
      ...baseParams,
      transaction: { mode: "tokenAssociate", gasLimit: new BigNumber(123456) } as any,
      status: { amount: new BigNumber(0), estimatedFees: new BigNumber(5) } as any,
    });

    expect(fields).toEqual([
      { type: "text", label: "Method", value: "Associate Token" },
      { type: "fees", label: "Fees" },
    ]);
  });
});
