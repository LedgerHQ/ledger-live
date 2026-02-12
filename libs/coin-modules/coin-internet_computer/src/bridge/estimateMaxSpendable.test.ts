import BigNumber from "bignumber.js";
import { ICP_FEES } from "../consts";
import { estimateMaxSpendable } from "./estimateMaxSpendable";

describe("estimateMaxSpendable", () => {
  it("should return balance minus transaction fees", async () => {
    const account = { balance: new BigNumber(100000) } as any;
    const transaction = { fees: new BigNumber(10000) } as any;
    const result = await estimateMaxSpendable({ account, transaction });
    expect(result).toEqual(new BigNumber(90000));
  });

  it("should use default fees when transaction fees are absent", async () => {
    const account = { balance: new BigNumber(100000) } as any;
    const result = await estimateMaxSpendable({ account, transaction: undefined as any });
    expect(result).toEqual(new BigNumber(100000 - ICP_FEES));
  });

  it("should return 0 when balance is less than fees", async () => {
    const account = { balance: new BigNumber(5000) } as any;
    const transaction = { fees: new BigNumber(10000) } as any;
    const result = await estimateMaxSpendable({ account, transaction });
    expect(result).toEqual(new BigNumber(0));
  });
});
