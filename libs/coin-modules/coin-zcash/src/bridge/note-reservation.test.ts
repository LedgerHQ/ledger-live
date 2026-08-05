import BigNumber from "bignumber.js";
import {
  reserveNotes,
  reconcileReservations,
  getReservedNullifiers,
  _resetReservationsForTest,
} from "./note-reservation";
import { selectNotes, estimateMaxSpendableAmount } from "../logic/coin-selection";
import type { SpendableNote } from "../network/types";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";
const NF1 = "nf1111";
const NF2 = "nf2222";
const NF3 = "nf3333";

function makeNote(overrides: Partial<SpendableNote> & { amount: BigNumber }): SpendableNote {
  return {
    txid: "tx1",
    outputIndex: 0,
    nullifier: "aa".repeat(32),
    rho: "ee".repeat(32),
    rseed: "bb".repeat(32),
    cmx: "cc".repeat(32),
    position: "0",
    recipient: "dd".repeat(43),
    ...overrides,
  };
}

beforeEach(() => {
  _resetReservationsForTest();
});

describe("reserveNotes", () => {
  it("adds nullifiers to the store for the given account", () => {
    reserveNotes(ACCOUNT_A, [NF1, NF2]);
    const reserved = getReservedNullifiers(ACCOUNT_A);
    expect(reserved.has(NF1)).toBe(true);
    expect(reserved.has(NF2)).toBe(true);
  });

  it("unions with the existing set on a second call — does not overwrite", () => {
    reserveNotes(ACCOUNT_A, [NF1]);
    reserveNotes(ACCOUNT_A, [NF2]);
    const reserved = getReservedNullifiers(ACCOUNT_A);
    expect(reserved.has(NF1)).toBe(true);
    expect(reserved.has(NF2)).toBe(true);
  });

  it("is a no-op for an empty nullifier array", () => {
    reserveNotes(ACCOUNT_A, []);
    expect(getReservedNullifiers(ACCOUNT_A).size).toBe(0);
  });
});

describe("getReservedNullifiers", () => {
  it("returns an empty Set for an unknown account", () => {
    const reserved = getReservedNullifiers("no-such-account");
    expect(reserved.size).toBe(0);
  });
});

describe("reconcileReservations", () => {
  it("removes confirmed-spent nullifiers from the store", () => {
    reserveNotes(ACCOUNT_A, [NF1, NF2, NF3]);
    reconcileReservations(ACCOUNT_A, [NF1], false);
    const reserved = getReservedNullifiers(ACCOUNT_A);
    expect(reserved.has(NF1)).toBe(false);
    expect(reserved.has(NF2)).toBe(true);
    expect(reserved.has(NF3)).toBe(true);
  });

  it("with syncComplete=false does NOT clear unconfirmed reservations", () => {
    reserveNotes(ACCOUNT_A, [NF1, NF2]);
    reconcileReservations(ACCOUNT_A, [], false);
    const reserved = getReservedNullifiers(ACCOUNT_A);
    expect(reserved.has(NF1)).toBe(true);
    expect(reserved.has(NF2)).toBe(true);
  });

  it("with syncComplete=true clears ALL remaining reservations for the account", () => {
    reserveNotes(ACCOUNT_A, [NF1, NF2, NF3]);
    // NF1 is confirmed-spent; NF2 and NF3 were never broadcast or rejected
    reconcileReservations(ACCOUNT_A, [NF1], true);
    const reserved = getReservedNullifiers(ACCOUNT_A);
    expect(reserved.size).toBe(0);
  });

  it("is a no-op on an unknown account (no throw)", () => {
    expect(() => reconcileReservations("no-such-account", [NF1], true)).not.toThrow();
  });

  it("isolates accounts — reconciling account A does not affect account B", () => {
    reserveNotes(ACCOUNT_A, [NF1]);
    reserveNotes(ACCOUNT_B, [NF2]);
    reconcileReservations(ACCOUNT_A, [NF1], true);
    expect(getReservedNullifiers(ACCOUNT_A).size).toBe(0);
    expect(getReservedNullifiers(ACCOUNT_B).has(NF2)).toBe(true);
  });
});

describe("account isolation", () => {
  it("reservations for account A do not appear in account B's set", () => {
    reserveNotes(ACCOUNT_A, [NF1, NF2]);
    reserveNotes(ACCOUNT_B, [NF3]);
    expect(getReservedNullifiers(ACCOUNT_A).has(NF3)).toBe(false);
    expect(getReservedNullifiers(ACCOUNT_B).has(NF1)).toBe(false);
    expect(getReservedNullifiers(ACCOUNT_B).has(NF2)).toBe(false);
  });
});

describe("_resetReservationsForTest", () => {
  it("empties all state — getReservedNullifiers returns empty after reset", () => {
    reserveNotes(ACCOUNT_A, [NF1]);
    reserveNotes(ACCOUNT_B, [NF2]);
    _resetReservationsForTest();
    expect(getReservedNullifiers(ACCOUNT_A).size).toBe(0);
    expect(getReservedNullifiers(ACCOUNT_B).size).toBe(0);
  });
});

// ── reservation filtering ──────────────────────────────────────────────
//
// The bridge (prepareTransaction / estimateMaxSpendable) filters the reserved
// nullifiers out of the spendable-note set before selection. These tests
// exercise that combination against the ZIP-317 selector.

describe("reservation filtering", () => {
  const ACCOUNT_ID = "account-filtering-test";

  it("two back-to-back sends select disjoint note sets when notes >= 2 × amount", () => {
    const note1 = makeNote({
      txid: "tx1",
      outputIndex: 0,
      nullifier: "aa".repeat(32),
      amount: new BigNumber(600_000),
    });
    const note2 = makeNote({
      txid: "tx2",
      outputIndex: 0,
      nullifier: "bb".repeat(32),
      amount: new BigNumber(600_000),
    });
    const allNotes = [note1, note2];

    // First send: select notes for 500_000
    const first = selectNotes(allNotes, new BigNumber(500_000), "shielded");
    expect(first).not.toBeUndefined();
    const firstNullifiers = first!.selectedNotes.map(n => n.nullifier);

    // Reserve the first selection
    reserveNotes(ACCOUNT_ID, firstNullifiers);

    // Second send: filter reserved notes, then select
    const reserved = getReservedNullifiers(ACCOUNT_ID);
    const filtered = allNotes.filter(n => !reserved.has(n.nullifier));
    const second = selectNotes(filtered, new BigNumber(500_000), "shielded");
    expect(second).not.toBeUndefined();
    const secondNullifiers = second!.selectedNotes.map(n => n.nullifier);

    // No nullifier may appear in both selections
    const overlap = firstNullifiers.filter(nf => secondNullifiers.includes(nf));
    expect(overlap).toHaveLength(0);
  });

  it("returns undefined from selectNotes when all notes are reserved", () => {
    const note = makeNote({
      txid: "tx1",
      outputIndex: 0,
      nullifier: "cc".repeat(32),
      amount: new BigNumber(600_000),
    });

    reserveNotes(ACCOUNT_ID, [note.nullifier]);

    const reserved = getReservedNullifiers(ACCOUNT_ID);
    const filtered = [note].filter(n => !reserved.has(n.nullifier));

    // Filtered set is empty — selectNotes returns undefined
    expect(selectNotes(filtered, new BigNumber(500_000), "shielded")).toBeUndefined();
    // estimateMaxSpendableAmount on an empty set returns 0
    expect(estimateMaxSpendableAmount(filtered, "shielded").toNumber()).toBe(0);
  });

  it("selectNotes succeeds again over the full set after _resetReservationsForTest", () => {
    const note = makeNote({
      txid: "tx1",
      outputIndex: 0,
      nullifier: "dd".repeat(32),
      amount: new BigNumber(600_000),
    });

    reserveNotes(ACCOUNT_ID, [note.nullifier]);

    // Verify reserved before reset
    expect(getReservedNullifiers(ACCOUNT_ID).has(note.nullifier)).toBe(true);

    _resetReservationsForTest();

    // After reset the full note set is unfiltered — selection succeeds
    const result = selectNotes([note], new BigNumber(500_000), "shielded");
    expect(result).not.toBeUndefined();
    expect(result!.selectedNotes).toHaveLength(1);
  });
});
