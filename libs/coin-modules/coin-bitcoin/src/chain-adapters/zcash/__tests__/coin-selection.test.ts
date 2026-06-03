import BigNumber from "bignumber.js";
import {
  computeZip317Fee,
  computeLogicalActions,
  selectNotes,
  estimateMaxSpendableAmount,
} from "../coin-selection";
import type { SpendableNote } from "../types";

// ── Helpers ────────────────────────────────────────────────────────────

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

// ── computeZip317Fee ───────────────────────────────────────────────────

describe("computeZip317Fee", () => {
  it("returns 10_000 for 2 logical actions (grace minimum)", () => {
    expect(computeZip317Fee(2).toNumber()).toBe(10_000);
  });

  it("returns 15_000 for 3 logical actions", () => {
    expect(computeZip317Fee(3).toNumber()).toBe(15_000);
  });

  it("clamps to grace minimum for 1 logical action", () => {
    expect(computeZip317Fee(1).toNumber()).toBe(10_000);
  });

  it("clamps to grace minimum for 0 logical actions", () => {
    expect(computeZip317Fee(0).toNumber()).toBe(10_000);
  });

  it("scales linearly for large action counts", () => {
    expect(computeZip317Fee(10).toNumber()).toBe(50_000);
    expect(computeZip317Fee(20).toNumber()).toBe(100_000);
  });
});

// ── computeLogicalActions ──────────────────────────────────────────────

describe("computeLogicalActions", () => {
  it("returns max(spends, outputs) for shielded transfer", () => {
    expect(computeLogicalActions(3, 2, "shielded")).toBe(3);
    expect(computeLogicalActions(2, 3, "shielded")).toBe(3);
    expect(computeLogicalActions(2, 2, "shielded")).toBe(2);
  });

  it("returns max(spends, 1) for shielded-to-transparent", () => {
    expect(computeLogicalActions(3, 1, "shielded-to-transparent")).toBe(3);
    expect(computeLogicalActions(1, 5, "shielded-to-transparent")).toBe(1);
  });

  it("returns 0 for transparent-to-shielded", () => {
    expect(computeLogicalActions(0, 1, "transparent-to-shielded")).toBe(0);
  });

  it("returns 0 for transparent", () => {
    expect(computeLogicalActions(1, 1, "transparent")).toBe(0);
  });
});

// ── selectNotes ────────────────────────────────────────────────────────

describe("selectNotes", () => {
  it("selects 1 large note with 2-action fee and correct change", () => {
    const notes = [makeNote({ amount: new BigNumber(1_000_000) })];
    const result = selectNotes(notes, new BigNumber(500_000), "shielded");

    expect(result?.selectedNotes).toHaveLength(1);
    expect(result?.fee.toNumber()).toBe(10_000); // 2 actions (grace)
    expect(result?.changeAmount.toNumber()).toBe(490_000); // 1_000_000 - 500_000 - 10_000
    expect(result?.totalInput.toNumber()).toBe(1_000_000);
  });

  it("selects multiple small notes to cover amount + fee", () => {
    const notes = [
      makeNote({ txid: "tx1", outputIndex: 0, amount: new BigNumber(200_000) }),
      makeNote({ txid: "tx1", outputIndex: 1, amount: new BigNumber(200_000) }),
      makeNote({ txid: "tx2", outputIndex: 0, amount: new BigNumber(200_000) }),
    ];
    const result = selectNotes(notes, new BigNumber(400_000), "shielded");

    // 3 notes of 200k each, amount 400k. max(3 spends, 2 outputs) = 3 actions, fee = 15k
    expect(result?.selectedNotes).toHaveLength(3);
    expect(result?.fee.toNumber()).toBe(15_000);
    expect(result?.totalInput.toNumber()).toBe(600_000);
    expect(result?.changeAmount.toNumber()).toBe(185_000);
  });

  it("returns undefined for insufficient balance", () => {
    const notes = [makeNote({ amount: new BigNumber(5_000) })];
    const result = selectNotes(notes, new BigNumber(100_000), "shielded");

    expect(result).toBeUndefined();
  });

  it("returns undefined when no notes provided", () => {
    const result = selectNotes([], new BigNumber(1_000), "shielded");
    expect(result).toBeUndefined();
  });

  it("handles exact amount matching (no change) — single note covers amount + fee exactly", () => {
    // 1 note, 1 recipient output = 2 actions minimum (grace), fee = 10_000
    // So: note amount = send_amount + 10_000 → changeAmount = 0
    const sendAmount = new BigNumber(90_000);
    const exactNote = makeNote({ amount: new BigNumber(100_000) }); // 100_000 = 90_000 + 10_000
    const result = selectNotes([exactNote], sendAmount, "shielded");

    expect(result?.changeAmount.toNumber()).toBe(0);
    expect(result?.fee.toNumber()).toBe(10_000);
  });

  it("converges fee iteration when action count changes with selection", () => {
    // Create many small notes that require multiple selections to accumulate enough
    const notes = Array.from({ length: 10 }, (_, i) =>
      makeNote({
        txid: "tx1",
        outputIndex: i,
        nullifier: `${"ab".repeat(31)}${i.toString(16).padStart(2, "0")}`,
        amount: new BigNumber(50_000),
      }),
    );
    const amount = new BigNumber(400_000);
    const result = selectNotes(notes, amount, "shielded");

    // 9 notes of 50k (450k total), amount 400k, max(9 spends, 2 outputs) = 9 actions, fee = 45k
    // change = 450k - 400k - 45k = 5k (exactly at DUST_THRESHOLD, not absorbed)
    expect(result?.selectedNotes).toHaveLength(9);
    expect(result?.totalInput.toNumber()).toBe(450_000);
    expect(result?.fee.toNumber()).toBe(45_000);
    expect(result?.changeAmount.toNumber()).toBe(5_000);
  });

  it("sorts notes largest-first to minimize action count", () => {
    const notes = [
      makeNote({
        txid: "small",
        outputIndex: 0,
        nullifier: "aa".repeat(32),
        amount: new BigNumber(1_000),
      }),
      makeNote({
        txid: "large",
        outputIndex: 0,
        nullifier: "bb".repeat(32),
        amount: new BigNumber(1_000_000),
      }),
    ];
    const result = selectNotes(notes, new BigNumber(500_000), "shielded");

    // Should pick the large note first (1 note is sufficient)
    expect(result?.selectedNotes).toHaveLength(1);
    expect(result?.selectedNotes[0].txid).toBe("large");
  });
});

// ── estimateMaxSpendableAmount ──────────────────────────────────────────

describe("estimateMaxSpendableAmount", () => {
  it("returns 0 for empty note set", () => {
    const result = estimateMaxSpendableAmount([], "shielded");
    expect(result.toNumber()).toBe(0);
  });

  it("returns total - fee(all notes, 1 output) for 3 notes", () => {
    const notes = [
      makeNote({
        txid: "tx1",
        outputIndex: 0,
        nullifier: "aa".repeat(32),
        amount: new BigNumber(100_000),
      }),
      makeNote({
        txid: "tx1",
        outputIndex: 1,
        nullifier: "bb".repeat(32),
        amount: new BigNumber(200_000),
      }),
      makeNote({
        txid: "tx2",
        outputIndex: 0,
        nullifier: "cc".repeat(32),
        amount: new BigNumber(300_000),
      }),
    ];
    // total = 600_000, spending 3 notes → 3 actions (max(3 spends, 1 output))
    // fee = max(2, 3) * 5_000 = 15_000
    const result = estimateMaxSpendableAmount(notes, "shielded");
    expect(result.toNumber()).toBe(585_000); // 600_000 - 15_000
  });

  it("returns total - fee(1 note, 1 output) for single note", () => {
    const notes = [makeNote({ amount: new BigNumber(100_000) })];
    // 1 spend, 1 output → max(1, 1) = 1 action, clamped to 2 (grace) → fee = 10_000
    const result = estimateMaxSpendableAmount(notes, "shielded");
    expect(result.toNumber()).toBe(90_000);
  });

  it("returns 0 when fee >= total balance (very small balance)", () => {
    const notes = [makeNote({ amount: new BigNumber(5_000) })];
    // total = 5_000, fee = 10_000 (grace) → max(5_000 - 10_000, 0) = 0
    const result = estimateMaxSpendableAmount(notes, "shielded");
    expect(result.toNumber()).toBe(0);
  });

  it("uses correct fee for shielded-to-transparent transfer type", () => {
    const notes = [
      makeNote({
        txid: "tx1",
        outputIndex: 0,
        nullifier: "aa".repeat(32),
        amount: new BigNumber(100_000),
      }),
      makeNote({
        txid: "tx1",
        outputIndex: 1,
        nullifier: "bb".repeat(32),
        amount: new BigNumber(100_000),
      }),
    ];
    // 2 spends, shielded-to-transparent: max(2 spends, 1) = 2 actions
    // fee = max(2, 2) * 5_000 = 10_000
    const result = estimateMaxSpendableAmount(notes, "shielded-to-transparent");
    expect(result.toNumber()).toBe(190_000); // 200_000 - 10_000
  });
});
