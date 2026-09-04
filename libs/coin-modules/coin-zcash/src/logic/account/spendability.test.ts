import { BigNumber } from "bignumber.js";
import {
  collectSelectableIronwoodNotes,
  getSpendableIronwoodBalance,
  hasBoundedIronwoodShortfall,
  hasMaturingIronwoodNotes,
  isMatureAtHeight,
  resolveReferenceHeight,
} from "./spendability";
import {
  ZCASH_MAX_IRONWOOD_ACTIONS,
  ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
} from "../../constants";
import type { ZcashAccount } from "../../types/bridge";

const REFERENCE_HEIGHT = 3_450_000;

const nullifierAt = (index: number) => index.toString(16).padStart(2, "0").repeat(32);

const ironwoodNote = (
  amount: number,
  index: number,
  overrides: { transfer_type?: string; isSpent?: boolean } = {},
) => ({
  amount: new BigNumber(amount),
  transfer_type: overrides.transfer_type ?? "incoming",
  memo: "",
  nullifier: nullifierAt(index),
  rho: "ee".repeat(32),
  rseed: "ff".repeat(32),
  cmx: "11".repeat(32),
  position: String(index),
  recipient: "22".repeat(43),
  isSpent: overrides.isSpent ?? false,
});

type NoteSpec = {
  amount: number;
  blockHeight: number;
  transfer_type?: string;
};

function account({
  notes,
  lastProcessedBlock = REFERENCE_HEIGHT,
  accountBlockHeight,
}: {
  notes: NoteSpec[];
  lastProcessedBlock?: number | null;
  accountBlockHeight?: number | null;
}): ZcashAccount {
  return {
    blockHeight: accountBlockHeight,
    privateInfo: {
      lastProcessedBlock,
      transactions: notes.map((spec, i) => ({
        id: `tx-${i}`,
        hex: "00",
        blockHeight: spec.blockHeight,
        blockHash: "cc".repeat(32),
        timestamp: 1_700_000_000,
        fee: new BigNumber(0),
        decryptedData: {
          orchard_outputs: [],
          sapling_outputs: [],
          ironwood_outputs: [
            ironwoodNote(
              spec.amount,
              i,
              spec.transfer_type ? { transfer_type: spec.transfer_type } : {},
            ),
          ],
        },
      })),
    },
  } as unknown as ZcashAccount;
}

const noReservations = new Set<string>();

describe("resolveReferenceHeight", () => {
  it("prefers lastProcessedBlock when it is present", () => {
    expect(resolveReferenceHeight({ lastProcessedBlock: 100 }, 50)).toBe(100);
  });

  it("falls back to the account block height when the shielded scan has none", () => {
    expect(resolveReferenceHeight({ lastProcessedBlock: null }, 50)).toBe(50);
    expect(resolveReferenceHeight(undefined, 50)).toBe(50);
  });

  it("treats no note as mature when neither height is known (fail-closed)", () => {
    expect(resolveReferenceHeight({ lastProcessedBlock: null }, null)).toBeNull();
    expect(resolveReferenceHeight(undefined, undefined)).toBeNull();
    expect(resolveReferenceHeight(null, null)).toBeNull();
  });
});

describe("isMatureAtHeight", () => {
  it("excludes a note one block short of the delay", () => {
    const reference = 1_000;
    const txBlockHeight = reference - (ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS - 1);

    expect(isMatureAtHeight(txBlockHeight, reference)).toBe(false);
  });

  it("includes a note exactly at the delay", () => {
    const reference = 1_000;
    const txBlockHeight = reference - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS;

    expect(isMatureAtHeight(txBlockHeight, reference)).toBe(true);
  });

  it("never grants maturity with an unknown reference height", () => {
    expect(isMatureAtHeight(0, null)).toBe(false);
  });
});

describe("collectSelectableIronwoodNotes", () => {
  it("excludes a note that has not yet cleared the delay, includes one that has", () => {
    const acc = account({
      notes: [
        {
          amount: 10_000,
          blockHeight: REFERENCE_HEIGHT - (ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS - 1),
        },
        {
          amount: 20_000,
          blockHeight: REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
        },
      ],
    });

    const selectable = collectSelectableIronwoodNotes(acc, noReservations);

    expect(selectable.map(n => n.amount.toNumber())).toEqual([20_000]);
  });

  it("becomes selectable once the reference height advances past the threshold", () => {
    const notes = [{ amount: 10_000, blockHeight: REFERENCE_HEIGHT - 3 }];

    expect(collectSelectableIronwoodNotes(account({ notes }), noReservations)).toEqual([]);

    const later = account({
      notes,
      lastProcessedBlock: REFERENCE_HEIGHT - 3 + ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
    });
    expect(
      collectSelectableIronwoodNotes(later, noReservations).map(n => n.amount.toNumber()),
    ).toEqual([10_000]);
  });

  it("excludes an immature incoming note, not only a change/outgoing one", () => {
    const acc = account({
      notes: [
        {
          amount: 10_000,
          blockHeight: REFERENCE_HEIGHT - 3,
          transfer_type: "incoming",
        },
        {
          amount: 20_000,
          blockHeight: REFERENCE_HEIGHT - 3,
          transfer_type: "internal",
        },
      ],
    });

    expect(collectSelectableIronwoodNotes(acc, noReservations)).toEqual([]);
  });

  it("treats no note as mature when the reference height is unknown", () => {
    const acc = account({
      notes: [{ amount: 10_000, blockHeight: 0 }],
      lastProcessedBlock: null,
      accountBlockHeight: null,
    });

    expect(collectSelectableIronwoodNotes(acc, noReservations)).toEqual([]);
  });

  it("composes maturity with reservation: only mature and unreserved notes are returned", () => {
    const acc = account({
      notes: [
        // mature, reserved
        {
          amount: 10_000,
          blockHeight: REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
        },
        // immature, unreserved
        { amount: 20_000, blockHeight: REFERENCE_HEIGHT - 3 },
        // mature, unreserved
        {
          amount: 30_000,
          blockHeight: REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
        },
      ],
    });
    const reserved = new Set([nullifierAt(0)]);

    const selectable = collectSelectableIronwoodNotes(acc, reserved);

    expect(selectable.map(n => n.amount.toNumber())).toEqual([30_000]);
  });
});

describe("collectSelectableIronwoodNotes, bounding", () => {
  const matureBlockHeight = REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS;

  it("returns every mature, unreserved note, unbounded and unsorted-input-order-independent, when at most the bound", () => {
    const amounts = Array.from({ length: ZCASH_MAX_IRONWOOD_ACTIONS }, (_, i) => (i + 1) * 1_000);
    const acc = account({
      notes: amounts.map(amount => ({ amount, blockHeight: matureBlockHeight })),
    });

    const selectable = collectSelectableIronwoodNotes(acc, noReservations);

    expect(selectable.map(n => n.amount.toNumber()).sort((a, b) => a - b)).toEqual(
      [...amounts].sort((a, b) => a - b),
    );
  });

  it("returns the largest ZCASH_MAX_IRONWOOD_ACTIONS mature, unreserved notes when more are available", () => {
    const extra = 5;
    const amounts = Array.from(
      { length: ZCASH_MAX_IRONWOOD_ACTIONS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const acc = account({
      notes: amounts.map(amount => ({ amount, blockHeight: matureBlockHeight })),
    });

    const selectable = collectSelectableIronwoodNotes(acc, noReservations);

    expect(selectable).toHaveLength(ZCASH_MAX_IRONWOOD_ACTIONS);
    const expectedLargest = [...amounts].sort((a, b) => b - a).slice(0, ZCASH_MAX_IRONWOOD_ACTIONS);
    expect(selectable.map(n => n.amount.toNumber())).toEqual(expectedLargest);
  });
});

describe("hasBoundedIronwoodShortfall", () => {
  const matureBlockHeight = REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS;

  it("is false when the pool holds at most the bound, regardless of totalSpent", () => {
    const amounts = Array.from({ length: ZCASH_MAX_IRONWOOD_ACTIONS }, (_, i) => (i + 1) * 1_000);
    const acc = account({
      notes: amounts.map(amount => ({ amount, blockHeight: matureBlockHeight })),
    });
    const total = amounts.reduce((sum, v) => sum + v, 0);

    expect(hasBoundedIronwoodShortfall(acc, noReservations, new BigNumber(total * 10))).toBe(false);
  });

  it("is true when totalSpent exceeds the bounded pool but not the full pool", () => {
    const extra = 5;
    const amounts = Array.from(
      { length: ZCASH_MAX_IRONWOOD_ACTIONS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const acc = account({
      notes: amounts.map(amount => ({ amount, blockHeight: matureBlockHeight })),
    });
    const fullTotal = amounts.reduce((sum, v) => sum + v, 0);
    const boundedTotal = [...amounts]
      .sort((a, b) => b - a)
      .slice(0, ZCASH_MAX_IRONWOOD_ACTIONS)
      .reduce((sum, v) => sum + v, 0);

    expect(hasBoundedIronwoodShortfall(acc, noReservations, new BigNumber(boundedTotal + 1))).toBe(
      true,
    );
    expect(fullTotal).toBeGreaterThan(boundedTotal + 1);
  });

  it("is false when totalSpent exceeds even the full pool -- genuine insufficiency", () => {
    const extra = 5;
    const amounts = Array.from(
      { length: ZCASH_MAX_IRONWOOD_ACTIONS + extra },
      (_, i) => (i + 1) * 1_000,
    );
    const acc = account({
      notes: amounts.map(amount => ({ amount, blockHeight: matureBlockHeight })),
    });
    const fullTotal = amounts.reduce((sum, v) => sum + v, 0);

    expect(hasBoundedIronwoodShortfall(acc, noReservations, new BigNumber(fullTotal + 1))).toBe(
      false,
    );
  });
});

describe("getSpendableIronwoodBalance", () => {
  it("sums exactly the notes the filter selects", () => {
    const acc = account({
      notes: [
        { amount: 10_000, blockHeight: REFERENCE_HEIGHT - 3 }, // immature
        {
          amount: 20_000,
          blockHeight: REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
        },
        {
          amount: 30_000,
          blockHeight: REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
        },
      ],
    });

    expect(getSpendableIronwoodBalance(acc, noReservations)).toEqual(new BigNumber(50_000));
  });

  it("answers zero when nothing is mature", () => {
    const acc = account({
      notes: [{ amount: 10_000, blockHeight: REFERENCE_HEIGHT - 1 }],
    });

    expect(getSpendableIronwoodBalance(acc, noReservations)).toEqual(new BigNumber(0));
  });

  it("counts every mature note even past the per-PCZT bound -- it's the real balance, not a max-per-send figure", () => {
    // A note past ZCASH_MAX_IRONWOOD_ACTIONS is real, owned, mature, unreserved
    // value: not spendable in one transaction, but still part of what the
    // account holds. Regression guard: getSpendableIronwoodBalance must not
    // silently drop it just because collectSelectableIronwoodNotes bounds the
    // per-transaction selection pool.
    const extra = 5;
    const notes = Array.from({ length: ZCASH_MAX_IRONWOOD_ACTIONS + extra }, (_, i) => ({
      amount: (i + 1) * 1_000,
      blockHeight: REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
    }));
    const acc = account({ notes });

    const fullTotal = notes.reduce((sum, n) => sum + n.amount, 0);
    const boundedTotal = collectSelectableIronwoodNotes(acc, noReservations).reduce(
      (sum, n) => sum.plus(n.amount),
      new BigNumber(0),
    );

    expect(getSpendableIronwoodBalance(acc, noReservations)).toEqual(new BigNumber(fullTotal));
    // The bound is real (selection is smaller) -- otherwise this test would
    // not actually exercise the regression it guards against.
    expect(boundedTotal.lt(fullTotal)).toBe(true);
  });
});

describe("hasMaturingIronwoodNotes", () => {
  it("fires for an immature incoming note", () => {
    const acc = account({
      notes: [
        {
          amount: 10_000,
          blockHeight: REFERENCE_HEIGHT - 3,
          transfer_type: "incoming",
        },
      ],
    });

    expect(hasMaturingIronwoodNotes(acc)).toBe(true);
  });

  it("fires for an immature change (internal) note", () => {
    const acc = account({
      notes: [
        {
          amount: 10_000,
          blockHeight: REFERENCE_HEIGHT - 3,
          transfer_type: "internal",
        },
      ],
    });

    expect(hasMaturingIronwoodNotes(acc)).toBe(true);
  });

  it("stays false once every note is mature", () => {
    const acc = account({
      notes: [
        {
          amount: 10_000,
          blockHeight: REFERENCE_HEIGHT - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS,
        },
      ],
    });

    expect(hasMaturingIronwoodNotes(acc)).toBe(false);
  });

  it("stays false when there are no notes at all", () => {
    expect(hasMaturingIronwoodNotes(account({ notes: [] }))).toBe(false);
  });
});
