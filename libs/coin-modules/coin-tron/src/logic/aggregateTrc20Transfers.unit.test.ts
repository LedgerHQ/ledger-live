import BigNumber from "bignumber.js";
import { TrongridTxInfo } from "../types";
import { aggregateTrc20Transfers } from "./aggregateTrc20Transfers";

const USER = "TUserAddress";
const POOL_A = "TPoolA";
const POOL_B = "TPoolB";
const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const WTRX = "TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR";
const DATE = new Date("2026-11-10T00:00:00Z");

function trc20Record(overrides: Partial<TrongridTxInfo>): TrongridTxInfo {
  return {
    txID: "swap",
    date: DATE,
    type: "TriggerSmartContract",
    tokenType: "trc20",
    tokenAddress: USDT,
    tokenId: USDT,
    from: POOL_A,
    to: USER,
    value: new BigNumber(1),
    fee: new BigNumber(345),
    blockHeight: 100,
    hasFailed: false,
    ...overrides,
  };
}

describe("aggregateTrc20Transfers", () => {
  it("keeps one record per token when a transaction moves different tokens", () => {
    const records = [
      trc20Record({
        tokenAddress: USDT,
        tokenId: USDT,
        from: USER,
        to: POOL_A,
        value: BigNumber(10),
      }),
      trc20Record({
        tokenAddress: WTRX,
        tokenId: WTRX,
        from: POOL_A,
        to: USER,
        value: BigNumber(7),
      }),
    ];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("keeps both directions of one token as separate records", () => {
    const records = [
      trc20Record({ from: USER, to: POOL_A, value: BigNumber(10) }),
      trc20Record({ from: POOL_B, to: USER, value: BigNumber(4) }),
    ];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("sums transfers of one token in one direction within a transaction", () => {
    const records = [
      trc20Record({ from: POOL_A, value: BigNumber(10) }),
      trc20Record({ from: POOL_B, value: BigNumber(5) }),
      trc20Record({ from: POOL_A, value: BigNumber(1) }),
    ];

    const result = aggregateTrc20Transfers(records, USER);

    expect(result).toHaveLength(1);
    expect(result[0].value).toEqual(BigNumber(16));
    expect(result[0].senders).toEqual([POOL_A, POOL_B]);
    expect(result[0].recipients).toEqual([USER]);
  });

  it("does not sum the fee, which every record of a transaction repeats", () => {
    const records = [
      trc20Record({ value: BigNumber(10), fee: BigNumber(345) }),
      trc20Record({ from: POOL_B, value: BigNumber(5), fee: BigNumber(345) }),
    ];

    expect(aggregateTrc20Transfers(records, USER)[0].fee).toEqual(BigNumber(345));
  });

  it("gives the same result whatever the order of the records", () => {
    const records = [
      trc20Record({ from: POOL_A, value: BigNumber(10) }),
      trc20Record({ from: POOL_B, value: BigNumber(5) }),
    ];

    const forward = aggregateTrc20Transfers(records, USER);
    const backward = aggregateTrc20Transfers([...records].reverse(), USER);

    const summary = (r: TrongridTxInfo) => [r.txID, r.value?.toString(), r.senders, r.recipients];
    expect(backward.map(summary)).toEqual(forward.map(summary));
  });

  it("does not merge transfers of different transactions", () => {
    const records = [trc20Record({ txID: "a" }), trc20Record({ txID: "b" })];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("keeps an approval apart from a transfer of the same token", () => {
    const records = [
      trc20Record({ from: USER, to: POOL_A, value: BigNumber(10) }),
      trc20Record({ type: "ContractApproval", from: USER, to: POOL_A, value: BigNumber(345) }),
    ];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("leaves native records untouched", () => {
    const native = trc20Record({
      tokenType: undefined,
      tokenAddress: undefined,
      tokenId: undefined,
    });
    const records = [native, { ...native }];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("keeps the position of the first record of each group", () => {
    const records = [
      trc20Record({ txID: "a", from: POOL_A, value: BigNumber(1) }),
      trc20Record({ txID: "b", value: BigNumber(2) }),
      trc20Record({ txID: "a", from: POOL_B, value: BigNumber(3) }),
    ];

    const result = aggregateTrc20Transfers(records, USER);

    expect(result.map(r => [r.txID, r.value?.toString()])).toEqual([
      ["a", "4"],
      ["b", "2"],
    ]);
  });
});
