import { BigNumber } from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import type { TransactionStatus } from "../types/bridge";

const config = (amount: number, estimatedFees: number) =>
  getDeviceTransactionConfig({
    status: {
      amount: new BigNumber(amount),
      estimatedFees: new BigNumber(estimatedFees),
    } as TransactionStatus,
  } as Parameters<typeof getDeviceTransactionConfig>[0]);

// The device shows the fields it is given, so a zero one would read as
// "Amount 0 ZEC" on screen rather than being left out.
describe("getDeviceTransactionConfig", () => {
  it("asks the device to review the amount and the fees of a send", async () => {
    expect(await config(150_000, 10_000)).toEqual([
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it.each([
    ["a send with nothing to pay for", 0, 10_000, [{ type: "fees", label: "Fees" }]],
    ["a free send", 150_000, 0, [{ type: "amount", label: "Amount" }]],
    ["a send that is neither", 0, 0, []],
  ])("leaves the zero fields of %s off the screen", async (_label, amount, fees, fields) => {
    expect(await config(amount, fees)).toEqual(fields);
  });
});
