import {
  fromJsonBalance,
  fromJsonOperation,
  fromJsonStake,
  toJsonBalance,
  toJsonOperation,
  toJsonSafe,
  toJsonStake,
} from "./json";
import { FEE_INCLUSIVE_OPERATION_TYPES } from "./operations";
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
    expect(json).not.toHaveProperty("feesPayer");
    expect(json).not.toHaveProperty("memo");
    expect(fromJsonOperation(json)).toEqual(op);
  });

  it("round-trip who paid the fee and the structured memo, in its JSON form", () => {
    const memo = { type: "map", memos: { id: 7n, text: "hello" } };
    const op = anOperation({ feesPayer: "payer", memo, details: { memo: "module's own" } });
    const json = toJsonOperation(op);
    expect(JSON.parse(JSON.stringify(json))).toEqual(json);
    expect(json).toMatchObject({
      feesPayer: "payer",
      memo: { type: "map", memos: { id: "7", text: "hello" } },
      details: { memo: "module's own" },
    });
    expect(fromJsonOperation(json)).toEqual({
      ...op,
      memo: { type: "map", memos: { id: "7", text: "hello" } },
    });
  });

  it("keep a null memo", () => {
    const json = toJsonOperation(anOperation({ memo: null }));
    expect(json.memo).toBeNull();
    expect(fromJsonOperation(json).memo).toBeNull();
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

type BigNumberLibrary = {
  BigNumber: {
    new (value: string | number): { toFixed: () => string };
    isBigNumber: (value: unknown) => value is { toFixed: () => string };
  };
};

/** The real bignumber.js, as coin modules use it (through coin-module-framework's own dependency). */
const { BigNumber } = jest.requireActual<BigNumberLibrary>(
  require.resolve("bignumber.js", {
    paths: [require.resolve("@ledgerhq/coin-module-framework/package.json")],
  }),
);

/** Ledger Wallet's former helper (generic coin framework `utils.ts`), which `toJsonSafe` replaces. */
function formerLedgerWalletToJsonSafe(value: unknown): unknown {
  const json = JSON.stringify(value, function (this: Record<string, unknown>, key, replaced) {
    const raw = this[key];
    if (typeof raw === "bigint") return raw.toString();
    if (BigNumber.isBigNumber(raw)) return raw.toFixed();
    if (typeof replaced === "bigint") return replaced.toString();
    return replaced;
  });
  return json === undefined ? undefined : JSON.parse(json);
}

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
    expect(toJsonSafe(3n)).toBe("3");
  });

  it("writes a BigNumber as a decimal string, without the exponent notation of its own JSON form", () => {
    const big = new BigNumber("1e21");
    expect(JSON.stringify(big)).toBe('"1e+21"');
    expect(toJsonSafe(big)).toBe("1000000000000000000000");
    expect(toJsonSafe(new BigNumber("0.0000001"))).toBe("0.0000001");
    expect(
      toJsonSafe({ familyExtra: { frozen: [{ amount: new BigNumber("2e30") }], fee: big } }),
    ).toEqual({
      familyExtra: { frozen: [{ amount: "2000000000000000000000000000000" }], fee: big.toFixed() },
    });
  });

  it("takes any copy of bignumber.js for a BigNumber", () => {
    const foreign = { _isBigNumber: true, toFixed: () => "12", toJSON: () => "1.2e+1" };
    expect(toJsonSafe([foreign])).toEqual(["12"]);
  });

  it("gives what JSON gives for buffers, maps, sets and functions", () => {
    expect(
      toJsonSafe({
        buffer: Buffer.from([1, 2]),
        map: new Map([["a", 1]]),
        set: new Set([1]),
        fn: () => 1,
        list: [undefined, () => 1],
      }),
    ).toEqual({ buffer: { type: "Buffer", data: [1, 2] }, map: {}, set: {}, list: [null, null] });
  });

  it("answers null for what JSON drops at the top level", () => {
    expect(toJsonSafe(undefined)).toBeNull();
    expect(toJsonSafe(() => 1)).toBeNull();
    expect(toJsonSafe(Symbol("s"))).toBeNull();
  });

  it("writes a bigint a toJSON answers as a decimal string", () => {
    expect(toJsonSafe({ sequence: { toJSON: () => 9n } })).toEqual({ sequence: "9" });
  });

  it("throws on a circular value", () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular["self"] = circular;
    expect(() => toJsonSafe(circular)).toThrow(TypeError);
  });

  it("gives what Ledger Wallet's former helper gave", () => {
    const inputs: unknown[] = [
      { a: 1n, b: new BigNumber("1e21"), c: [new BigNumber("-3.5e-7"), 4n], d: undefined },
      { date: new Date(0), buffer: Buffer.from("ab"), map: new Map([[1, 2]]), set: new Set() },
      [null, undefined, "x", 1.5, true, { nested: { deeper: [new BigNumber(NaN)] } }],
      { sequence: { toJSON: () => 9n } },
      new BigNumber("123456789012345678901234567890"),
      "plain",
      0,
      null,
    ];
    for (const input of inputs) {
      expect(toJsonSafe(input)).toEqual(formerLedgerWalletToJsonSafe(input));
    }
  });
});

describe("FEE_INCLUSIVE_OPERATION_TYPES", () => {
  it("lists the types whose native value includes the fee", () => {
    expect([...FEE_INCLUSIVE_OPERATION_TYPES]).toEqual([
      "OUT",
      "FEES",
      "DELEGATE",
      "UNDELEGATE",
      "REDELEGATE",
      "CONTRACT_CALL",
      "UPDATE_ACCOUNT",
    ]);
    expect(FEE_INCLUSIVE_OPERATION_TYPES.has("IN")).toBe(false);
    expect(FEE_INCLUSIVE_OPERATION_TYPES.has("FREEZE")).toBe(false);
  });
});
