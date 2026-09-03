import { BigNumber } from "bignumber.js";
import { hasBoundedTransparentShortfall, resolveTransparentUtxos } from "./statusHelpers";
import { ZCASH_MAX_TRANSPARENT_INPUTS } from "../constants";
import type { BitcoinOutput, Transaction, ZcashAccount, ZcashTransferType } from "../types/bridge";

const T_ADDRESS = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";

const utxo = (value: number, outputIndex = 0): BitcoinOutput => ({
  hash: "aa".repeat(32),
  outputIndex,
  blockHeight: 3_425_800,
  address: T_ADDRESS,
  value: new BigNumber(value),
  rbf: false,
  isChange: false,
});

function account(utxos: BitcoinOutput[]): ZcashAccount {
  return {
    type: "Account",
    id: "js:2:zcash:xpub6D:",
    currency: { id: "zcash", name: "Zcash" },
    bitcoinResources: { utxos },
  } as unknown as ZcashAccount;
}

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    family: "zcash",
    transferType: "transparent",
    amount: new BigNumber(10_000),
    recipient: T_ADDRESS,
    useAllAmount: false,
    ...overrides,
  } as Transaction;
}

// One UTXO per value, decreasing in the array so an "already sorted" fixture
// can never accidentally pass a largest-first assertion by coincidence.
const utxosOfValues = (values: number[]): BitcoinOutput[] =>
  values.map((value, i) => utxo(value, i));

describe("resolveTransparentUtxos, bounding", () => {
  it("returns all UTXOs, largest-first, when the account holds at most the bound", () => {
    const values = Array.from({ length: ZCASH_MAX_TRANSPARENT_INPUTS }, (_, i) => (i + 1) * 1_000);
    const acc = account(utxosOfValues(values));

    const resolved = resolveTransparentUtxos(acc, transaction());

    expect(resolved).toHaveLength(ZCASH_MAX_TRANSPARENT_INPUTS);
    expect(resolved.map(u => u.value.toNumber())).toEqual([...values].sort((a, b) => b - a));
  });

  it("bounds to the largest ZCASH_MAX_TRANSPARENT_INPUTS UTXOs when the account holds more", () => {
    const extra = 5;
    const values = Array.from(
      { length: ZCASH_MAX_TRANSPARENT_INPUTS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const acc = account(utxosOfValues(values));

    const resolved = resolveTransparentUtxos(acc, transaction());

    expect(resolved).toHaveLength(ZCASH_MAX_TRANSPARENT_INPUTS);
    const expectedLargest = [...values]
      .sort((a, b) => b - a)
      .slice(0, ZCASH_MAX_TRANSPARENT_INPUTS);
    expect(resolved.map(u => u.value.toNumber())).toEqual(expectedLargest);
  });

  it("applies the same bound to a caller-supplied selectedUtxos override", () => {
    const extra = 3;
    const values = Array.from(
      { length: ZCASH_MAX_TRANSPARENT_INPUTS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const selectedUtxos = utxosOfValues(values);
    const acc = account([]);

    const resolved = resolveTransparentUtxos(acc, transaction({ selectedUtxos }));

    expect(resolved).toHaveLength(ZCASH_MAX_TRANSPARENT_INPUTS);
    const expectedLargest = [...values]
      .sort((a, b) => b - a)
      .slice(0, ZCASH_MAX_TRANSPARENT_INPUTS);
    expect(resolved.map(u => u.value.toNumber())).toEqual(expectedLargest);
  });

  it.each(["shielded", "shielded-to-transparent"] as ZcashTransferType[])(
    "still returns [] for %s, unchanged",
    transferType => {
      const values = Array.from(
        { length: ZCASH_MAX_TRANSPARENT_INPUTS + 5 },
        (_, i) => (i + 1) * 1_000,
      );
      const acc = account(utxosOfValues(values));

      expect(resolveTransparentUtxos(acc, transaction({ transferType }))).toEqual([]);
    },
  );
});

describe("hasBoundedTransparentShortfall", () => {
  it.each(["shielded", "shielded-to-transparent"] as ZcashTransferType[])(
    "is false for %s -- a flow that never spends transparent inputs",
    transferType => {
      const values = Array.from(
        { length: ZCASH_MAX_TRANSPARENT_INPUTS + 5 },
        (_, i) => (i + 1) * 1_000,
      );
      const acc = account(utxosOfValues(values));

      expect(
        hasBoundedTransparentShortfall(acc, transaction({ transferType }), new BigNumber(1e9)),
      ).toBe(false);
    },
  );

  it("is false when the account holds at most the bound, regardless of totalSpent", () => {
    const values = Array.from({ length: ZCASH_MAX_TRANSPARENT_INPUTS }, (_, i) => (i + 1) * 1_000);
    const acc = account(utxosOfValues(values));
    const total = values.reduce((sum, v) => sum + v, 0);

    expect(hasBoundedTransparentShortfall(acc, transaction(), new BigNumber(total * 10))).toBe(
      false,
    );
  });

  it("is true when totalSpent exceeds the bounded balance but not the full balance", () => {
    const extra = 5;
    const values = Array.from(
      { length: ZCASH_MAX_TRANSPARENT_INPUTS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const acc = account(utxosOfValues(values));
    const fullBalance = values.reduce((sum, v) => sum + v, 0);
    const boundedBalance = [...values]
      .sort((a, b) => b - a)
      .slice(0, ZCASH_MAX_TRANSPARENT_INPUTS)
      .reduce((sum, v) => sum + v, 0);
    // Strictly between the bounded and full balances.
    const totalSpent = new BigNumber(boundedBalance + 1).lt(fullBalance)
      ? new BigNumber(boundedBalance + 1)
      : new BigNumber(fullBalance);

    expect(hasBoundedTransparentShortfall(acc, transaction(), totalSpent)).toBe(true);
  });

  it("is false when totalSpent exceeds even the full (unbounded) balance -- genuine insufficiency", () => {
    const extra = 5;
    const values = Array.from(
      { length: ZCASH_MAX_TRANSPARENT_INPUTS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const acc = account(utxosOfValues(values));
    const fullBalance = values.reduce((sum, v) => sum + v, 0);

    expect(hasBoundedTransparentShortfall(acc, transaction(), new BigNumber(fullBalance + 1))).toBe(
      false,
    );
  });
});
