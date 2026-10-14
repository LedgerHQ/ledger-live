import {
  fromJsonBalance,
  fromJsonOperation,
  fromJsonStake,
  toJsonBalance,
  toJsonOperation,
  toJsonSafe,
  toJsonStake,
} from "./json";
import { anOperation } from "./test-utils";
import type { Stake } from "@ledgerhq/coin-module-framework/api/types";

const stake: Stake = {
  uid: "s",
  address: "a",
  state: "active",
  actions: [],
  asset: { type: "native" },
  amount: 10n,
  amountDeposited: 8n,
  amountRewarded: 2n,
  stateUpdatedAt: new Date("2026-01-01T00:00:00.000Z"),
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  details: { weight: 3n },
};

describe("operations", () => {
  it("round-trip through JSON", () => {
    const op = anOperation({ optimistic: true, details: { nonce: 4n, when: new Date(0) } });
    const json = toJsonOperation(op);
    expect(JSON.parse(JSON.stringify(json))).toEqual(json);
    expect(json).toMatchObject({
      value: "1",
      fee: "0",
      details: { nonce: "4", when: "1970-01-01T00:00:00.000Z" },
    });
    expect(fromJsonOperation(json)).toEqual({
      ...op,
      details: { nonce: "4", when: "1970-01-01T00:00:00.000Z" },
    });
  });

  it("keep a pending operation without block, details or optimistic flag", () => {
    const op = anOperation({ block: null });
    const json = toJsonOperation(op);
    expect(json).not.toHaveProperty("optimistic");
    expect(json).not.toHaveProperty("details");
    expect(fromJsonOperation(json)).toEqual(op);
  });
});

describe("stakes and balances", () => {
  it("round-trip through JSON with every optional amount and date", () => {
    expect(fromJsonStake(toJsonStake(stake))).toEqual({ ...stake, details: { weight: "3" } });
    const balance = { value: 5n, asset: { type: "native" }, locked: 1n, stake };
    expect(fromJsonBalance(toJsonBalance(balance))).toEqual({
      ...balance,
      stake: { ...stake, details: { weight: "3" } },
    });
  });

  it("round-trip through JSON without the optional fields", () => {
    const bare: Stake = {
      uid: "s",
      address: "a",
      state: "active",
      actions: [],
      asset: { type: "native" },
      amount: 1n,
    };
    expect(toJsonStake(bare)).toEqual({ ...bare, amount: "1" });
    expect(fromJsonStake(toJsonStake(bare))).toEqual(bare);
    const balance = { value: 5n, asset: { type: "native" } };
    expect(toJsonBalance(balance)).toEqual({ value: "5", asset: { type: "native" } });
    expect(fromJsonBalance(toJsonBalance(balance))).toEqual(balance);
  });
});

describe("toJsonSafe", () => {
  it("keeps JSON values, converts bigints and dates, drops undefined fields", () => {
    expect(
      toJsonSafe({ a: 1, b: "x", c: true, d: null, e: undefined, f: [2n, new Date(0)] }),
    ).toEqual({
      a: 1,
      b: "x",
      c: true,
      d: null,
      f: ["2", "1970-01-01T00:00:00.000Z"],
    });
    expect(toJsonSafe(undefined)).toBeNull();
  });

  it("rejects what JSON cannot hold", () => {
    expect(() => toJsonSafe(() => 1)).toThrow("Not JSON safe: function");
    expect(() => toJsonSafe(Symbol("s"))).toThrow("Not JSON safe: symbol");
  });
});
