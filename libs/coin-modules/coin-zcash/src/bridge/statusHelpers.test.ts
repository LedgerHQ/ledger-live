import BigNumber from "bignumber.js";
import {
  excludePendingInputs,
  hasBoundedTransparentShortfall,
  pendingSpentInputs,
  resolveTransparentUtxos,
} from "./statusHelpers";
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

  it("passes a caller-supplied selectedUtxos override through unbounded and in caller order", () => {
    // A future coin-control caller picks its own UTXOs deliberately; silently
    // reordering or truncating that explicit selection would spend a
    // different set than the caller asked for. The device ceiling is only
    // enforced on the account-synced default set above, which the wallet is
    // free to choose from.
    const extra = 3;
    const values = Array.from(
      { length: ZCASH_MAX_TRANSPARENT_INPUTS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const selectedUtxos = utxosOfValues(values); // increasing order, on purpose
    const acc = account([]);

    const resolved = resolveTransparentUtxos(acc, transaction({ selectedUtxos }));

    expect(resolved).toBe(selectedUtxos);
    expect(resolved.map(u => u.value.toNumber())).toEqual(values);
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

  it("is false for a selectedUtxos override past the bound -- the ceiling isn't enforced there", () => {
    const extra = 3;
    const values = Array.from(
      { length: ZCASH_MAX_TRANSPARENT_INPUTS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const selectedUtxos = utxosOfValues(values);
    const acc = account([]);
    const fullBalance = values.reduce((sum, v) => sum + v, 0);

    expect(
      hasBoundedTransparentShortfall(
        acc,
        transaction({ selectedUtxos }),
        new BigNumber(fullBalance),
      ),
    ).toBe(false);
  });
});

describe("excludePendingInputs", () => {
  const HASH = "aa".repeat(32);
  const utxos = [utxo(1_000, 0), utxo(2_000, 1), utxo(3_000, 2)];
  const withPending = (extras: unknown[]): ZcashAccount =>
    ({
      ...account(utxos),
      pendingOperations: extras.map(extra => ({ extra })),
    }) as unknown as ZcashAccount;

  it("lists the spent outputs as hash and index, skipping malformed legacy inputs", () => {
    const acc = withPending([{ inputs: [`${HASH}-2`, "no-index-x", "-3"] }]);

    expect(pendingSpentInputs(acc)).toEqual([{ hash: HASH, outputIndex: 2 }]);
  });

  it("drops the outputs named by inputRefs", () => {
    const acc = withPending([{ inputRefs: [{ hash: HASH, outputIndex: 1, address: T_ADDRESS }] }]);

    expect(excludePendingInputs(acc, utxos).map(u => u.outputIndex)).toEqual([0, 2]);
  });

  it("drops the outputs named by legacy inputs when there are no inputRefs", () => {
    const acc = withPending([{ inputs: [`${HASH}-0`, `${HASH}-2`] }]);

    expect(excludePendingInputs(acc, utxos).map(u => u.outputIndex)).toEqual([1]);
  });

  it("prefers inputRefs over inputs of the same operation", () => {
    const acc = withPending([
      { inputs: [`${HASH}-0`], inputRefs: [{ hash: HASH, outputIndex: 2, address: T_ADDRESS }] },
    ]);

    expect(excludePendingInputs(acc, utxos).map(u => u.outputIndex)).toEqual([0, 1]);
  });

  it("accumulates the inputs of every pending operation", () => {
    const acc = withPending([{ inputs: [`${HASH}-0`] }, { inputs: [`${HASH}-1`] }]);

    expect(excludePendingInputs(acc, utxos).map(u => u.outputIndex)).toEqual([2]);
  });

  it("keeps an output of another transaction with the same index", () => {
    const acc = withPending([{ inputs: [`${"bb".repeat(32)}-0`] }]);

    expect(excludePendingInputs(acc, utxos)).toEqual(utxos);
  });

  it.each([
    ["no pending operation", withPending([])],
    ["a pending operation without extra", withPending([undefined])],
    ["a pending operation that spends no UTXO", withPending([{ shieldedNullifiers: ["ab"] }])],
  ])("keeps every output with %s", (_label, acc) => {
    expect(excludePendingInputs(acc, utxos)).toEqual(utxos);
  });

  it("copes with an account that has no pendingOperations", () => {
    expect(excludePendingInputs(account(utxos), utxos)).toEqual(utxos);
  });
});
