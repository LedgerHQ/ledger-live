import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import {
  reserveNotes,
  releaseConfirmedNullifiers,
  releaseRetiredReservations,
  releaseReservation,
  getReservedNullifiers,
  getSessionReservedNullifiers,
  _resetReservationsForTest,
} from "./note-reservation";
import { selectNotes, estimateMaxSpendableAmount } from "../logic/coin-selection";
import type { SpendableNote } from "../network/types";

const ACCOUNT_A = "account-a";
const ACCOUNT_B = "account-b";
const OP_1 = "76ec3b38";
const OP_2 = "91ba4c07";
const NF1 = "nf1111";
const NF2 = "nf2222";
const NF3 = "nf3333";

const RETENTION = getEnv("OPERATION_OPTIMISTIC_RETENTION");

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

/** The optimistic operation a signed shielded send leaves on the account. */
const pendingOperation = (shieldedNullifiers: string[]) => ({
  extra: { zcashShielded: true, shieldedNullifiers },
});

beforeEach(() => {
  _resetReservationsForTest();
});

describe("reserveNotes", () => {
  it("adds nullifiers to the store for the given account", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1, NF2]);
    const reserved = getSessionReservedNullifiers(ACCOUNT_A);
    expect(reserved.has(NF1)).toBe(true);
    expect(reserved.has(NF2)).toBe(true);
  });

  it("unions with what the same operation already holds — does not overwrite", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    reserveNotes(ACCOUNT_A, OP_1, [NF2]);
    const reserved = getSessionReservedNullifiers(ACCOUNT_A);
    expect(reserved.has(NF1)).toBe(true);
    expect(reserved.has(NF2)).toBe(true);
  });

  it("holds the reservations of two operations in flight at once", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    reserveNotes(ACCOUNT_A, OP_2, [NF2]);
    const reserved = getSessionReservedNullifiers(ACCOUNT_A);
    expect(reserved.has(NF1)).toBe(true);
    expect(reserved.has(NF2)).toBe(true);
  });

  it("is a no-op for an empty nullifier array", () => {
    reserveNotes(ACCOUNT_A, OP_1, []);
    expect(getSessionReservedNullifiers(ACCOUNT_A).size).toBe(0);
  });
});

describe("getSessionReservedNullifiers", () => {
  it("returns an empty Set for an unknown account", () => {
    const reserved = getSessionReservedNullifiers("no-such-account");
    expect(reserved.size).toBe(0);
  });
});

// The persisted half of a reservation. A spend signed and broadcast in a session
// that ended before it confirmed leaves nothing in the store, and its notes must
// still not be selectable — the optimistic operation is what carries them over.
describe("getReservedNullifiers", () => {
  it("holds the notes of a pending operation with nothing reserved in this session", () => {
    const account = { id: ACCOUNT_A, pendingOperations: [pendingOperation([NF1, NF2])] };
    const reserved = getReservedNullifiers(account);
    expect(reserved.has(NF1)).toBe(true);
    expect(reserved.has(NF2)).toBe(true);
  });

  it("unions the session's reservations with the pending operations'", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    const account = { id: ACCOUNT_A, pendingOperations: [pendingOperation([NF2])] };
    const reserved = getReservedNullifiers(account);
    expect(reserved.has(NF1)).toBe(true);
    expect(reserved.has(NF2)).toBe(true);
  });

  it("counts a nullifier held by both sources once", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    const account = { id: ACCOUNT_A, pendingOperations: [pendingOperation([NF1])] };
    expect(getReservedNullifiers(account).size).toBe(1);
  });

  it("reads every pending operation, not just the first", () => {
    const account = {
      id: ACCOUNT_A,
      pendingOperations: [pendingOperation([NF1]), pendingOperation([NF2, NF3])],
    };
    expect(getReservedNullifiers(account).size).toBe(3);
  });

  it("ignores an extra that carries no shielded nullifier list", () => {
    const account = {
      id: ACCOUNT_A,
      pendingOperations: [
        { extra: undefined },
        { extra: null },
        { extra: {} },
        { extra: { inputs: ["some-hash-0"] } },
        { extra: "not-an-object" },
        { extra: { shieldedNullifiers: "not-an-array" } },
        { extra: { shieldedNullifiers: [NF1, 42, null] } },
      ],
    };
    expect([...getReservedNullifiers(account)]).toEqual([NF1]);
  });

  it("holds nothing for an account with no pending operations", () => {
    expect(getReservedNullifiers({ id: ACCOUNT_A, pendingOperations: [] }).size).toBe(0);
    expect(getReservedNullifiers({ id: ACCOUNT_A }).size).toBe(0);
  });

  it("does not read another account's pending operations", () => {
    reserveNotes(ACCOUNT_B, OP_1, [NF3]);
    const account = { id: ACCOUNT_A, pendingOperations: [pendingOperation([NF1])] };
    expect(getReservedNullifiers(account).has(NF3)).toBe(false);
  });
});

describe("releaseConfirmedNullifiers", () => {
  it("removes the nullifiers the scan reported spent", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1, NF2, NF3]);
    releaseConfirmedNullifiers(ACCOUNT_A, [NF1]);
    const reserved = getSessionReservedNullifiers(ACCOUNT_A);
    expect(reserved.has(NF1)).toBe(false);
    expect(reserved.has(NF2)).toBe(true);
    expect(reserved.has(NF3)).toBe(true);
  });

  it("reaches the nullifiers of every operation in flight", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    reserveNotes(ACCOUNT_A, OP_2, [NF2]);
    releaseConfirmedNullifiers(ACCOUNT_A, [NF1, NF2]);
    expect(getSessionReservedNullifiers(ACCOUNT_A).size).toBe(0);
  });

  it("keeps everything when the scan reported nothing spent", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1, NF2]);
    releaseConfirmedNullifiers(ACCOUNT_A, []);
    expect(getSessionReservedNullifiers(ACCOUNT_A).size).toBe(2);
  });

  it("is a no-op on an unknown account (no throw)", () => {
    expect(() => releaseConfirmedNullifiers("no-such-account", [NF1])).not.toThrow();
  });

  it("isolates accounts", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    reserveNotes(ACCOUNT_B, OP_1, [NF1]);
    releaseConfirmedNullifiers(ACCOUNT_A, [NF1]);
    expect(getSessionReservedNullifiers(ACCOUNT_A).size).toBe(0);
    expect(getSessionReservedNullifiers(ACCOUNT_B).has(NF1)).toBe(true);
  });
});

describe("releaseRetiredReservations", () => {
  it("releases the reservation of an operation that has confirmed", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    releaseRetiredReservations(ACCOUNT_A, new Set([OP_1]));
    expect(getSessionReservedNullifiers(ACCOUNT_A).size).toBe(0);
  });

  it("leaves the operations still in flight reserved", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    reserveNotes(ACCOUNT_A, OP_2, [NF2]);
    releaseRetiredReservations(ACCOUNT_A, new Set([OP_1]));
    const reserved = getSessionReservedNullifiers(ACCOUNT_A);
    expect(reserved.has(NF1)).toBe(false);
    expect(reserved.has(NF2)).toBe(true);
  });

  // The premature release this store exists to avoid: a send is signed, a sync
  // runs and confirms nothing about it, and its notes must stay off the table.
  it("holds a reservation no confirmed operation accounts for", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1, NF2]);
    releaseRetiredReservations(ACCOUNT_A, new Set(["some-other-transaction"]));
    expect(getSessionReservedNullifiers(ACCOUNT_A).size).toBe(2);
  });

  // Fake timers freeze Date.now() so reserveNotes and the releaseRetiredReservations
  // call read the same clock value — the boundary arithmetic is exact, not race-prone.
  describe("expiry boundary", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("holds a reservation right up to the end of the optimistic window", () => {
      reserveNotes(ACCOUNT_A, OP_1, [NF1]);
      releaseRetiredReservations(ACCOUNT_A, new Set(), Date.now() + RETENTION - 1);
      expect(getSessionReservedNullifiers(ACCOUNT_A).has(NF1)).toBe(true);
    });

    // Past that window Ledger Wallet drops the optimistic operation itself, so a
    // broadcast that never confirmed stops holding notes at the same moment.
    it("releases a reservation that outlived the optimistic window", () => {
      reserveNotes(ACCOUNT_A, OP_1, [NF1]);
      releaseRetiredReservations(ACCOUNT_A, new Set(), Date.now() + RETENTION + 1);
      expect(getSessionReservedNullifiers(ACCOUNT_A).size).toBe(0);
    });
  });

  it("is a no-op on an unknown account (no throw)", () => {
    expect(() => releaseRetiredReservations("no-such-account", new Set([OP_1]))).not.toThrow();
  });

  it("isolates accounts — retiring account A's operation leaves account B alone", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    reserveNotes(ACCOUNT_B, OP_1, [NF2]);
    releaseRetiredReservations(ACCOUNT_A, new Set([OP_1]));
    expect(getSessionReservedNullifiers(ACCOUNT_A).size).toBe(0);
    expect(getSessionReservedNullifiers(ACCOUNT_B).has(NF2)).toBe(true);
  });
});

describe("releaseReservation", () => {
  it("hands back the notes of the operation named, and only those", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    reserveNotes(ACCOUNT_A, OP_2, [NF2]);
    releaseReservation(ACCOUNT_A, OP_1);
    const reserved = getSessionReservedNullifiers(ACCOUNT_A);
    expect(reserved.has(NF1)).toBe(false);
    expect(reserved.has(NF2)).toBe(true);
  });

  it("is a no-op for an operation or account it holds nothing for", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    releaseReservation(ACCOUNT_A, "no-such-operation");
    releaseReservation("no-such-account", OP_1);
    expect(getSessionReservedNullifiers(ACCOUNT_A).has(NF1)).toBe(true);
  });
});

describe("_resetReservationsForTest", () => {
  it("empties all state — getReservedNullifiers returns empty after reset", () => {
    reserveNotes(ACCOUNT_A, OP_1, [NF1]);
    reserveNotes(ACCOUNT_B, OP_1, [NF2]);
    _resetReservationsForTest();
    expect(getSessionReservedNullifiers(ACCOUNT_A).size).toBe(0);
    expect(getSessionReservedNullifiers(ACCOUNT_B).size).toBe(0);
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
    reserveNotes(ACCOUNT_ID, OP_1, firstNullifiers);

    // Second send: filter reserved notes, then select
    const reserved = getSessionReservedNullifiers(ACCOUNT_ID);
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

    reserveNotes(ACCOUNT_ID, OP_1, [note.nullifier]);

    const reserved = getSessionReservedNullifiers(ACCOUNT_ID);
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

    reserveNotes(ACCOUNT_ID, OP_1, [note.nullifier]);

    // Verify reserved before reset
    expect(getSessionReservedNullifiers(ACCOUNT_ID).has(note.nullifier)).toBe(true);

    _resetReservationsForTest();

    // After reset the full note set is unfiltered — selection succeeds
    const result = selectNotes([note], new BigNumber(500_000), "shielded");
    expect(result).not.toBeUndefined();
    expect(result!.selectedNotes).toHaveLength(1);
  });
});
