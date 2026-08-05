import BigNumber from "bignumber.js";
import { ICP_FEES } from "../consts";
import { Transaction } from "../types";
import { estimateMaxSpendable } from "./estimateMaxSpendable";

const account = { balance: new BigNumber(1_000_000_000) } as any;
const tx = (over: Partial<Transaction>): Transaction =>
  ({ fees: new BigNumber(ICP_FEES), ...over }) as Transaction;

describe("estimateMaxSpendable", () => {
  it("subtracts the fee for a transfer", async () => {
    const max = await estimateMaxSpendable({ account, transaction: tx({ type: "send" }) });
    expect(max.toString()).toBe(new BigNumber(1_000_000_000 - ICP_FEES).toString());
  });

  it("subtracts no fee for a governance operation", async () => {
    const max = await estimateMaxSpendable({
      account,
      transaction: tx({ type: "start_dissolving" }),
    });
    expect(max.toString()).toBe("1000000000");
  });

  it("never returns a negative value", async () => {
    const max = await estimateMaxSpendable({
      account: { balance: new BigNumber(1) } as any,
      transaction: tx({ type: "send" }),
    });
    expect(max.toString()).toBe("0");
  });
});
