/* eslint-disable @typescript-eslint/consistent-type-assertions */
import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import type { HederaGenericTransaction, TransactionStatus } from "./types";

const fieldsFor = (transaction: Partial<HederaGenericTransaction>, estimatedFees: number) =>
  getDeviceTransactionConfig({
    account: {} as AccountLike,
    transaction: {
      family: "hedera",
      mode: "send",
      amount: new BigNumber(0),
      recipient: "",
      ...transaction,
    },
    status: { estimatedFees: new BigNumber(estimatedFees) } as TransactionStatus,
  });

describe("getDeviceTransactionConfig", () => {
  it("shows method, amount and fees for a send", async () => {
    expect(await fieldsFor({}, 10)).toEqual([
      { type: "text", label: "Method", value: "Transfer" },
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("shows Transfer All and no fees row for a zero fee", async () => {
    expect(await fieldsFor({ useAllAmount: true }, 0)).toEqual([
      { type: "text", label: "Method", value: "Transfer All" },
      { type: "amount", label: "Amount" },
    ]);
  });

  it("shows Associate Token and no amount row for a token association", async () => {
    expect(await fieldsFor({ mode: "tokenAssociate" }, 10)).toEqual([
      { type: "text", label: "Method", value: "Associate Token" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it.each([
    ["delegate", "Delegate"],
    ["redelegate", "Redelegate"],
    ["undelegate", "Undelegate"],
    ["claimReward", "Claim Rewards"],
  ] as const)("shows the %s method, fees and node id", async (mode, method) => {
    expect(await fieldsFor({ mode, valId: "3" }, 10)).toEqual([
      { type: "text", label: "Method", value: method },
      { type: "fees", label: "Fees" },
      { type: "text", label: "Staked Node ID", value: "3" },
    ]);
  });

  it("leaves out the node id when none is set", async () => {
    expect(await fieldsFor({ mode: "undelegate" }, 0)).toEqual([
      { type: "text", label: "Method", value: "Undelegate" },
    ]);
  });
});
