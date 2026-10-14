import { BigNumber } from "bignumber.js";
import { buildEstimateMaxSpendable } from "./estimateMaxSpendable";
import {
  LEGACY_MARGINAL_FEE,
  ZIP2009_MARGINAL_FEE,
  computeShieldedSpendFee,
  estimateMaxSpendableTransparent,
} from "../logic/coin-selection";
import type { BitcoinOutput, Transaction, ZcashAccount } from "../types/bridge";
import {
  ZCASH_MAX_TRANSPARENT_INPUTS,
  ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
} from "../constants";
import { contextWithZip2009, testContext } from "../test/coinConfig";

const estimateMaxSpendable = buildEstimateMaxSpendable(testContext);

const U_ADDRESS =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";
const T_ADDRESS = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";
const REFERENCE_HEIGHT = 3_450_000;
const MATURE_BLOCK = REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS;
const IMMATURE_BLOCK = REFERENCE_HEIGHT - 3;

const utxo = (value: number, outputIndex: number): BitcoinOutput => ({
  hash: "aa".repeat(32),
  outputIndex,
  blockHeight: 3_425_800,
  address: T_ADDRESS,
  value: new BigNumber(value),
  rbf: false,
  isChange: false,
});

function accountWithUtxos(values: number[]): ZcashAccount {
  return {
    type: "Account",
    id: "js:2:zcash:xpub6D:",
    currency: { id: "zcash", name: "Zcash" },
    bitcoinResources: { utxos: values.map((v, i) => utxo(v, i)) },
  } as unknown as ZcashAccount;
}

const nullifierAt = (index: number) => index.toString(16).padStart(2, "0").repeat(32);

const note = (amount: number, index: number) => ({
  amount: new BigNumber(amount),
  transfer_type: "incoming",
  memo: "",
  nullifier: nullifierAt(index),
  rho: "ee".repeat(32),
  rseed: "ff".repeat(32),
  cmx: "11".repeat(32),
  position: String(index),
  recipient: "22".repeat(43),
  isSpent: false,
});

/** One Ironwood note per transaction, so each can carry its own block height. */
function accountWithIronwoodNotes(
  specs: Array<{ amount: number; blockHeight: number }>,
): ZcashAccount {
  return {
    type: "Account",
    id: "js:2:zcash:xpub6D:",
    currency: { id: "zcash", name: "Zcash" },
    bitcoinResources: { utxos: [] },
    privateInfo: {
      lastProcessedBlock: REFERENCE_HEIGHT,
      transactions: specs.map((spec, i) => ({
        id: `tx-${i}`,
        hex: "00",
        blockHeight: spec.blockHeight,
        blockHash: "cc".repeat(32),
        timestamp: 1_700_000_000,
        fee: new BigNumber(0),
        decryptedData: {
          orchard_outputs: [],
          sapling_outputs: [],
          ironwood_outputs: [note(spec.amount, i)],
        },
      })),
    },
  } as unknown as ZcashAccount;
}

const shieldedTransaction: Transaction = {
  family: "zcash",
  transferType: "shielded",
  amount: new BigNumber(0),
  recipient: U_ADDRESS,
  useAllAmount: true,
} as Transaction;

const max = (acc: ZcashAccount) =>
  estimateMaxSpendable({
    account: acc,
    transaction: shieldedTransaction,
  } as never);

describe("estimateMaxSpendable, note maturity", () => {
  it("excludes immature notes from the figure it computes", async () => {
    const acc = accountWithIronwoodNotes([
      { amount: 30_000, blockHeight: MATURE_BLOCK },
      { amount: 50_000, blockHeight: IMMATURE_BLOCK },
    ]);

    // Only the 30k mature note counts: total 30k minus the 1-spend fee.
    const fee = computeShieldedSpendFee(1, false, "shielded", LEGACY_MARGINAL_FEE);
    expect(await max(acc)).toEqual(BigNumber.max(new BigNumber(30_000).minus(fee), 0));
  });

  it("equals the mature-only total minus the fee for spending all of it", async () => {
    const acc = accountWithIronwoodNotes([
      { amount: 20_000, blockHeight: MATURE_BLOCK },
      { amount: 30_000, blockHeight: MATURE_BLOCK },
      { amount: 50_000, blockHeight: IMMATURE_BLOCK },
    ]);

    // Two mature notes, spent whole: 50k minus the 2-spend fee.
    const fee = computeShieldedSpendFee(2, false, "shielded", LEGACY_MARGINAL_FEE);
    expect(await max(acc)).toEqual(BigNumber.max(new BigNumber(50_000).minus(fee), 0));
  });

  it("returns 0 when every note is immature", async () => {
    const acc = accountWithIronwoodNotes([
      { amount: 30_000, blockHeight: IMMATURE_BLOCK },
      { amount: 50_000, blockHeight: IMMATURE_BLOCK },
    ]);

    expect(await max(acc)).toEqual(new BigNumber(0));
  });

  it("returns the full total when every note is mature", async () => {
    const acc = accountWithIronwoodNotes([
      { amount: 30_000, blockHeight: MATURE_BLOCK },
      { amount: 20_000, blockHeight: MATURE_BLOCK },
    ]);

    const fee = computeShieldedSpendFee(2, false, "shielded", LEGACY_MARGINAL_FEE);
    expect(await max(acc)).toEqual(BigNumber.max(new BigNumber(50_000).minus(fee), 0));
  });
});

describe("estimateMaxSpendable, transparent-input bound", () => {
  // A "Max" this returns must always be an amount a real transparent send
  // (bounded to ZCASH_MAX_TRANSPARENT_INPUTS) can actually carry -- whether or
  // not a transaction is passed to resolve the bound through.

  it("bounds the transparent pool when called WITHOUT a transaction (no-tx fallback)", async () => {
    const extra = 5;
    const values = Array.from(
      { length: ZCASH_MAX_TRANSPARENT_INPUTS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const acc = accountWithUtxos(values);

    const result = await estimateMaxSpendable({ account: acc } as never);

    // The defect this guards: before the fix, this path summed every UTXO
    // account.bitcoinResources holds instead of resolving through the bounded
    // funnel, so it could disagree with the bounded (with-transaction) figure
    // below -- either over- or under-stating it, since ZIP-317 fees scale
    // with input count and a dropped dust UTXO can raise the net figure.
    const boundedValues = [...values].sort((a, b) => b - a).slice(0, ZCASH_MAX_TRANSPARENT_INPUTS);
    const expected = estimateMaxSpendableTransparent(
      boundedValues.map(v => new BigNumber(v)),
      "transparent",
      LEGACY_MARGINAL_FEE,
    );
    expect(result).toEqual(expected);
  });

  it("bounds the transparent pool when called WITH a transparent transaction", async () => {
    const extra = 5;
    const values = Array.from(
      { length: ZCASH_MAX_TRANSPARENT_INPUTS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const acc = accountWithUtxos(values);
    const transparentTransaction = {
      family: "zcash",
      transferType: "transparent",
      amount: new BigNumber(0),
      recipient: T_ADDRESS,
      useAllAmount: true,
    } as Transaction;

    const result = await estimateMaxSpendable({
      account: acc,
      transaction: transparentTransaction,
    } as never);

    const boundedValues = [...values].sort((a, b) => b - a).slice(0, ZCASH_MAX_TRANSPARENT_INPUTS);
    const expected = estimateMaxSpendableTransparent(
      boundedValues.map(v => new BigNumber(v)),
      "transparent",
      LEGACY_MARGINAL_FEE,
    );
    expect(result).toEqual(expected);
  });

  it("returns the naive full-sum figure when the account holds at most the bound (no-tx and with-tx agree)", async () => {
    const values = Array.from({ length: ZCASH_MAX_TRANSPARENT_INPUTS }, (_, i) => (i + 1) * 1_000);
    const acc = accountWithUtxos(values);
    const transparentTransaction = {
      family: "zcash",
      transferType: "transparent",
      amount: new BigNumber(0),
      recipient: T_ADDRESS,
      useAllAmount: true,
    } as Transaction;

    const withoutTx = await estimateMaxSpendable({ account: acc } as never);
    const withTx = await estimateMaxSpendable({
      account: acc,
      transaction: transparentTransaction,
    } as never);

    const expected = estimateMaxSpendableTransparent(
      values.map(v => new BigNumber(v)),
      "transparent",
      LEGACY_MARGINAL_FEE,
    );
    expect(withoutTx).toEqual(expected);
    expect(withTx).toEqual(expected);
  });
});

describe("estimateMaxSpendable, marginal fee by height", () => {
  const at = (acc: ZcashAccount, currencyId: string, blockHeight: number): ZcashAccount =>
    ({
      ...acc,
      currency: { id: currencyId, name: "Zcash" },
      blockHeight,
    }) as unknown as ZcashAccount;
  const transparentSend = (transferType: Transaction["transferType"]): Transaction =>
    ({
      family: "zcash",
      transferType,
      amount: new BigNumber(0),
      recipient: T_ADDRESS,
      useAllAmount: true,
    }) as Transaction;

  it.each([
    ["below the margin edge", "zcash", 3_590_098, 300_000 - 10_000],
    ["at the margin edge", "zcash", 3_590_099, 300_000 - 2_000],
    ["on a test network at height 0", "zcash_testnet", 0, 300_000 - 2_000],
  ])(
    "leaves a transparent balance minus the account's fee, %s",
    async (_label, id, height, expected) => {
      const acc = at(accountWithUtxos([100_000, 200_000]), id, height);

      expect(
        await estimateMaxSpendable({
          account: acc,
          transaction: transparentSend("transparent"),
        } as never),
      ).toEqual(new BigNumber(expected));
      // No transaction: the same account-synced set, priced the same way.
      expect(await estimateMaxSpendable({ account: acc } as never)).toEqual(
        new BigNumber(expected),
      );
    },
  );

  it("prices the transparent-to-shielded layout at the account's fee", async () => {
    const acc = at(accountWithUtxos([100_000, 200_000]), "zcash", 3_590_099);

    expect(
      await estimateMaxSpendable({
        account: acc,
        transaction: transparentSend("transparent-to-shielded"),
      } as never),
    ).toEqual(new BigNumber(300_000 - 4_000));
  });

  it.each([
    ["below the margin edge", 3_590_098, LEGACY_MARGINAL_FEE],
    ["at the margin edge", 3_590_099, ZIP2009_MARGINAL_FEE],
  ])(
    "leaves a shielded balance minus the account's fee, %s",
    async (_label, height, marginalFee) => {
      const acc = at(
        accountWithIronwoodNotes([{ amount: 100_000, blockHeight: MATURE_BLOCK }]),
        "zcash",
        height,
      );

      const expected = new BigNumber(100_000).minus(
        computeShieldedSpendFee(1, false, "shielded", marginalFee),
      );
      expect(await max(acc)).toEqual(expected);
      expect(expected).toEqual(new BigNumber(100_000 - 2 * marginalFee));
    },
  );
});

describe("estimateMaxSpendable, zip2009 coin config", () => {
  const at = (acc: ZcashAccount, blockHeight: number): ZcashAccount =>
    ({ ...acc, blockHeight }) as unknown as ZcashAccount;
  const transparent = {
    family: "zcash",
    transferType: "transparent",
    amount: new BigNumber(0),
    recipient: T_ADDRESS,
    useAllAmount: true,
  } as Transaction;

  it.each([
    ["absent", undefined, 3_600_000, 300_000 - 2_000],
    ["delayed past the account height", { mainnetHeight: 3_700_000 }, 3_600_000, 300_000 - 10_000],
    [
      "delayed, account past the new switch",
      { mainnetHeight: 3_700_000 },
      3_700_099,
      300_000 - 2_000,
    ],
    ["disabled", { mainnetHeight: null }, 4_500_000, 300_000 - 10_000],
    ["below the builder's switch", { mainnetHeight: 3_500_000 }, 3_590_098, 300_000 - 10_000],
  ])(
    "leaves a transparent balance minus the fee of the setting %s",
    async (_l, zip2009, h, max) => {
      const estimate = buildEstimateMaxSpendable(contextWithZip2009(zip2009));
      const acc = at(accountWithUtxos([100_000, 200_000]), h);

      expect(await estimate({ account: acc, transaction: transparent } as never)).toEqual(
        new BigNumber(max),
      );
      expect(await estimate({ account: acc } as never)).toEqual(new BigNumber(max));
    },
  );

  it("leaves a shielded balance minus the fee of the setting", async () => {
    const acc = at(
      accountWithIronwoodNotes([{ amount: 100_000, blockHeight: MATURE_BLOCK }]),
      3_600_000,
    );
    const delayed = buildEstimateMaxSpendable(contextWithZip2009({ mainnetHeight: 3_700_000 }));

    expect(await delayed({ account: acc, transaction: shieldedTransaction } as never)).toEqual(
      new BigNumber(100_000 - 2 * LEGACY_MARGINAL_FEE),
    );
    expect(await max(acc)).toEqual(new BigNumber(100_000 - 2 * ZIP2009_MARGINAL_FEE));
  });
});
