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
        value: new BigNumber(10),
      }),
      trc20Record({
        tokenAddress: WTRX,
        tokenId: WTRX,
        from: POOL_A,
        to: USER,
        value: new BigNumber(7),
      }),
    ];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("keeps both directions of one token as separate records", () => {
    const records = [
      trc20Record({ from: USER, to: POOL_A, value: new BigNumber(10) }),
      trc20Record({ from: POOL_B, to: USER, value: new BigNumber(4) }),
    ];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("sums transfers of one token in one direction within a transaction", () => {
    const records = [
      trc20Record({ from: POOL_A, value: new BigNumber(10) }),
      trc20Record({ from: POOL_B, value: new BigNumber(5) }),
      trc20Record({ from: POOL_A, value: new BigNumber(1) }),
    ];

    const result = aggregateTrc20Transfers(records, USER);

    expect(result).toHaveLength(1);
    expect(result[0].value).toEqual(new BigNumber(16));
    expect(result[0].senders).toEqual([POOL_A, POOL_B]);
    expect(result[0].recipients).toEqual([USER]);
  });

  it("does not sum the fee, which every record of a transaction repeats", () => {
    const records = [
      trc20Record({ value: new BigNumber(10), fee: new BigNumber(345) }),
      trc20Record({ from: POOL_B, value: new BigNumber(5), fee: new BigNumber(345) }),
    ];

    expect(aggregateTrc20Transfers(records, USER)[0].fee).toEqual(new BigNumber(345));
  });

  it("gives the same result whatever the order of the records", () => {
    const records = [
      trc20Record({ from: POOL_A, value: new BigNumber(10) }),
      trc20Record({ from: POOL_B, value: new BigNumber(5) }),
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
      trc20Record({ from: USER, to: POOL_A, value: new BigNumber(10) }),
      trc20Record({ type: "ContractApproval", from: USER, to: POOL_A, value: new BigNumber(345) }),
    ];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("leaves native records untouched", () => {
    const native: TrongridTxInfo = {
      txID: "swap",
      date: DATE,
      type: "TransferContract",
      from: POOL_A,
      to: USER,
      value: new BigNumber(1),
      blockHeight: 100,
      hasFailed: false,
    };
    const records = [native, { ...native }];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("does not sum approvals, whose value is the fee", () => {
    const approval = trc20Record({ type: "ContractApproval", from: USER, to: POOL_A });
    const records = [approval, { ...approval, to: POOL_B }];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("does not sum transfers of no clear direction for the account", () => {
    const records = [
      trc20Record({ from: POOL_A, to: POOL_B }),
      trc20Record({ from: POOL_B, to: POOL_A }),
    ];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("does not sum transfers without a token address", () => {
    const records = [
      trc20Record({ tokenAddress: undefined, tokenId: undefined, value: new BigNumber(1) }),
      trc20Record({ tokenAddress: undefined, tokenId: undefined, value: new BigNumber(2) }),
    ];

    expect(aggregateTrc20Transfers(records, USER)).toEqual(records);
  });

  it("keeps the position of the first record of each group", () => {
    const records = [
      trc20Record({ txID: "a", from: POOL_A, value: new BigNumber(1) }),
      trc20Record({ txID: "b", value: new BigNumber(2) }),
      trc20Record({ txID: "a", from: POOL_B, value: new BigNumber(3) }),
    ];

    const result = aggregateTrc20Transfers(records, USER);

    expect(result.map(r => [r.txID, r.value?.toString()])).toEqual([
      ["a", "4"],
      ["b", "2"],
    ]);
  });
});
