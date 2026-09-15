import BigNumber from "bignumber.js";
import {
  computeZip317Fee,
  computeShieldedSpendFee,
  computeShieldingFee,
  computeTransparentSelectionFee,
  selectNotes,
  selectTransparentInputs,
  estimateMaxSpendableAmount,
  estimateMaxSpendableTransparent,
} from "./coin-selection";
import type { SpendableNote } from "../network/types";
import type { ZcashTransferType } from "../types/bridge";

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
//
// Mirrors the Rust `zip317_fee` unit tests (craft.rs): the Orchard pool is
// floored to 2 actions independently of the transparent pool.

describe("computeZip317Fee", () => {
  it("floors an empty layout to the grace minimum", () => {
    expect(computeZip317Fee(0, 0, 0, 0).toNumber()).toBe(10_000);
  });

  it("floors the Orchard pool to 2 actions (1 spend + 1 orchard out → 10_000)", () => {
    expect(computeZip317Fee(1, 1, 0, 0).toNumber()).toBe(10_000);
  });

  it("adds the transparent leg on top of the Orchard floor (1 spend + 1 t-out → 15_000)", () => {
    // orchard = max(2, max(1,0)) = 2; transparent = max(0,1) = 1; logical = 3.
    expect(computeZip317Fee(1, 0, 0, 1).toNumber()).toBe(15_000);
  });

  it("adds a transparent input on top of the Orchard floor (1 orchard out + 1 t-in → 15_000)", () => {
    // orchard = max(2, max(0,1)) = 2; transparent = max(1,0) = 1; logical = 3.
    expect(computeZip317Fee(0, 1, 1, 0).toNumber()).toBe(15_000);
  });

  it("uses max(t_in, t_out) for a transparent-only layout", () => {
    expect(computeZip317Fee(0, 0, 1, 1).toNumber()).toBe(10_000); // max(1,1)=1 → grace
    expect(computeZip317Fee(0, 0, 2, 1).toNumber()).toBe(10_000); // max(2,1)=2 → grace
    expect(computeZip317Fee(0, 0, 3, 1).toNumber()).toBe(15_000); // max(3,1)=3
  });

  it("scales the Orchard pool past the floor", () => {
    expect(computeZip317Fee(3, 3, 0, 0).toNumber()).toBe(15_000);
    expect(computeZip317Fee(10, 10, 0, 0).toNumber()).toBe(50_000);
  });
});

// ── computeShieldedSpendFee ─────────────────────────────────────────────

describe("computeShieldedSpendFee", () => {
  it("floors the Orchard bundle at 2 actions for shielded (grace minimum)", () => {
    expect(computeShieldedSpendFee(1, false, "shielded").toNumber()).toBe(10_000);
    expect(computeShieldedSpendFee(1, true, "shielded").toNumber()).toBe(10_000);
    expect(computeShieldedSpendFee(2, true, "shielded").toNumber()).toBe(10_000);
  });

  it("scales the Orchard bundle past the floor for shielded", () => {
    // 3 spends + recipient + change = max(3, 2) orchard actions → 15_000.
    expect(computeShieldedSpendFee(3, true, "shielded").toNumber()).toBe(15_000);
  });

  it("adds the transparent recipient leg for shielded-to-transparent (1 spend → 15_000)", () => {
    // orchard = max(2, max(1,0)) = 2; transparent recipient = 1; logical = 3.
    expect(computeShieldedSpendFee(1, false, "shielded-to-transparent").toNumber()).toBe(15_000);
    // A shielded change note does not raise the fee (Orchard floor already 2).
    expect(computeShieldedSpendFee(1, true, "shielded-to-transparent").toNumber()).toBe(15_000);
  });

  it("scales with the spend count for shielded-to-transparent (2 spends → 15_000)", () => {
    // orchard = max(2, max(2,0)) = 2; transparent recipient = 1; logical = 3.
    expect(computeShieldedSpendFee(2, false, "shielded-to-transparent").toNumber()).toBe(15_000);
    // 3 spends: orchard = 3; + transparent recipient = 4 → 20_000.
    expect(computeShieldedSpendFee(3, false, "shielded-to-transparent").toNumber()).toBe(20_000);
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

    expect(result).toBe(undefined);
  });

  it("returns undefined when no notes provided", () => {
    const result = selectNotes([], new BigNumber(1_000), "shielded");
    expect(result).toBe(undefined);
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
    // change = 450k - 400k - 45k = 5k, kept as change (never folded into the fee)
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

  it("selects notes for shielded-to-transparent with transparent recipient fee leg", () => {
    const notes = [makeNote({ amount: new BigNumber(1_000_000) })];
    const result = selectNotes(notes, new BigNumber(500_000), "shielded-to-transparent");

    expect(result?.selectedNotes).toHaveLength(1);
    // orchard-family floor 2 + 1 t-out = 3 logical → 15_000.
    expect(result?.fee.toNumber()).toBe(15_000);
    expect(result?.changeAmount.toNumber()).toBe(485_000);
  });

  // ── Invariant: the returned fee must be bit-identical to the ZIP-317 fee for
  // the resulting layout (spends, orchard outputs incl. change), because the
  // native Ironwood builder rejects any fee that is not exactly that. Absorbing
  // residual change into the fee (as a "dust" convenience) breaks this contract
  // for every flow selectNotes serves -- "shielded" and "shielded-to-transparent"
  // both build as V6 (Ironwood) PCZTs against the strict builder.
  describe("fee/layout invariant (never diverges from computeShieldedSpendFee)", () => {
    it.each([
      ["single note, no change", [1_000_000], 500_000, "shielded"],
      ["single note, exact match", [100_000], 90_000, "shielded"],
      ["multiple small notes", [200_000, 200_000, 200_000], 400_000, "shielded"],
      ["many notes converging over several rounds", Array(10).fill(50_000), 400_000, "shielded"],
      [
        "shielded-to-transparent, transparent recipient leg",
        [1_000_000],
        500_000,
        "shielded-to-transparent",
      ],
      // The user's field failure: 4 notes summing 4_512_800, amount 4_487_803 --
      // the residual after the correct fee (4_997) is below the old dust bound.
      [
        "field failure — residual under the old dust threshold",
        [1_128_200, 1_128_200, 1_128_200, 1_128_200],
        4_487_803,
        "shielded",
      ],
    ] as [string, number[], number, ZcashTransferType][])(
      "%s: fee === computeShieldedSpendFee(selection, hasChange, transferType)",
      (_label, noteAmounts, amount, transferType) => {
        const notes = noteAmounts.map((a, i) =>
          makeNote({ txid: "tx", outputIndex: i, amount: new BigNumber(a) }),
        );
        const result = selectNotes(notes, new BigNumber(amount), transferType);

        expect(result).not.toBeUndefined();
        const hasChange = result!.changeAmount.gt(0);
        const expectedFee = computeShieldedSpendFee(
          result!.selectedNotes.length,
          hasChange,
          transferType,
        );
        expect(result!.fee.toNumber()).toBe(expectedFee.toNumber());
      },
    );
  });

  // ── Regression vector: exact numbers from the field failure. A z→z send with
  // 4 notes totalling 4_512_800, amount 4_487_803. The correct ZIP-317 fee for
  // the final layout (4 spends, 1 recipient + 1 change = 2 orchard outputs) is
  // 20_000 zats, leaving 4_997 as change -- a residual the old dust-absorption
  // logic folded into the fee instead, producing an unbuildable 24_997 fee.
  it("prices the field failure at the exact ZIP-317 fee, not an absorbed one", () => {
    const notes = [1_128_200, 1_128_200, 1_128_200, 1_128_200].map((a, i) =>
      makeNote({ txid: "tx", outputIndex: i, amount: new BigNumber(a) }),
    );
    const result = selectNotes(notes, new BigNumber(4_487_803), "shielded");

    expect(result?.selectedNotes).toHaveLength(4);
    expect(result?.totalInput.toNumber()).toBe(4_512_800);
    expect(result?.fee.toNumber()).toBe(20_000);
    expect(result?.changeAmount.toNumber()).toBe(4_997);
  });
});

// ── computeShieldingFee ────────────────────────────────────────────────

describe("computeShieldingFee", () => {
  it("floors the Orchard output pool at 2 actions on top of the transparent inputs", () => {
    // 1 t-in + Orchard recipient: orchard = max(2, 1) = 2; transparent = 1;
    // logical = 3 → 15_000. (The old collapsed model returned 10_000 here, which
    // the native builder rejects — this is the regression under test.)
    expect(computeShieldingFee(1, 1).toNumber()).toBe(15_000);
    // 1 t-in + recipient + shielded change: orchard = max(2, 2) = 2; still 15_000.
    expect(computeShieldingFee(1, 2).toNumber()).toBe(15_000);
    // 3 t-in + recipient + change: orchard = max(2, 2) = 2; transparent = 3;
    // logical = 5 → 25_000.
    expect(computeShieldingFee(3, 2).toNumber()).toBe(25_000);
  });
});

describe("computeTransparentSelectionFee", () => {
  // `selectTransparentInputs` relies on this equality: because dropping the change
  // output never lowers the fee, an amount it cannot afford with a change output it
  // cannot afford without one either, so there is no single-output retry to attempt
  // and no remainder left without a change output to hold it. Both floors are what
  // make the two equal -- the grace actions for t→t, the Orchard minimum for t→z.
  // If a future fee-model change breaks the equality (say a t→z's change becomes a
  // transparent output), this fails and the retry has to be reconsidered.
  it.each<ZcashTransferType>(["transparent", "transparent-to-shielded"])(
    "prices 1 and 2 outputs identically for %s, whatever the input count",
    transferType => {
      for (const inputCount of [1, 2, 3, 8, 32]) {
        expect(computeTransparentSelectionFee(inputCount, 1, transferType).toNumber()).toBe(
          computeTransparentSelectionFee(inputCount, 2, transferType).toNumber(),
        );
      }
    },
  );
});

// ── selectTransparentInputs ────────────────────────────────────────────

describe("selectTransparentInputs (transparent-to-shielded)", () => {
  it("returns undefined when there are no UTXOs", () => {
    expect(
      selectTransparentInputs([], new BigNumber(1_000), false, "transparent-to-shielded"),
    ).toBe(undefined);
  });

  it("computes fee (with change) and change for a single UTXO", () => {
    const result = selectTransparentInputs(
      [new BigNumber(1_000_000)],
      new BigNumber(100_000),
      false,
      "transparent-to-shielded",
    );
    // 1 input + recipient + change = 3 actions → 15_000; change = 885_000
    expect(result?.fee.toNumber()).toBe(15_000);
    expect(result?.changeAmount.toNumber()).toBe(885_000);
    expect(result?.totalInput.toNumber()).toBe(1_000_000);
  });

  it("does not lower the fee by dropping the shielded change (Orchard floor is 2)", () => {
    // With change: fee = 15_000, change = 1_000_000 - 990_000 - 15_000 = -5_000 < 0
    // → retry without change. But dropping the shielded change does NOT lower the
    // ZIP-317 fee (the Orchard bundle is floored to 2 actions regardless), so the
    // no-change fee is still 15_000 and the balance cannot cover amount + fee.
    expect(
      selectTransparentInputs(
        [new BigNumber(1_000_000)],
        new BigNumber(990_000),
        false,
        "transparent-to-shielded",
      ),
    ).toBe(undefined);
  });

  it("does not inflate the fee by absorbing dust change (native owns change)", () => {
    // fee = 15_000; change = 1_000_000 - 982_000 - 15_000 = 3_000. "transparent-to-shielded"
    // also builds as a V6 (Ironwood) PCZT, so the fee must stay at the exact
    // ZIP-317 value; the residual remains as change instead of inflating the fee.
    const result = selectTransparentInputs(
      [new BigNumber(1_000_000)],
      new BigNumber(982_000),
      false,
      "transparent-to-shielded",
    );
    expect(result?.fee.toNumber()).toBe(15_000);
    expect(result?.changeAmount.toNumber()).toBe(3_000);
  });

  it("returns undefined when balance cannot cover amount + fee", () => {
    expect(
      selectTransparentInputs(
        [new BigNumber(1_000)],
        new BigNumber(100_000),
        false,
        "transparent-to-shielded",
      ),
    ).toBe(undefined);
  });

  it("computes useAllAmount fee with a single recipient output and no change", () => {
    const result = selectTransparentInputs(
      [new BigNumber(1_000_000)],
      new BigNumber(0),
      true,
      "transparent-to-shielded",
    );
    // 1 t-in + 1 Orchard recipient: orchard = max(2, 1) = 2; transparent = 1;
    // logical = 3 → 15_000; no change.
    expect(result?.fee.toNumber()).toBe(15_000);
    expect(result?.changeAmount.toNumber()).toBe(0);
    expect(result?.totalInput.toNumber()).toBe(1_000_000);
  });

  it("returns undefined for useAllAmount when the fee exceeds the balance", () => {
    expect(
      selectTransparentInputs(
        [new BigNumber(5_000)],
        new BigNumber(0),
        true,
        "transparent-to-shielded",
      ),
    ).toBe(undefined);
  });

  // ── Invariant: same contract as selectNotes, for the same reason --
  // "transparent-to-shielded" also builds as a V6 (Ironwood) PCZT, so the
  // returned fee must be bit-identical to the ZIP-317 fee for the final
  // (inputCount, outputCount) layout. Folding residual change into the fee
  // breaks this for any UTXO set whose leftover lands under the old dust bound.
  describe("fee/layout invariant (never diverges from computeTransparentSelectionFee)", () => {
    it.each([
      ["single UTXO, plenty of change", [1_000_000], 100_000],
      ["single UTXO, dust-sized residual", [1_000_000], 982_000],
      ["multiple UTXOs", [400_000, 400_000, 400_000], 700_000],
    ] as [string, number[], number][])(
      "%s: fee === computeTransparentSelectionFee(inputCount, outputCount, transferType)",
      (_label, utxoAmounts, amount) => {
        const utxos = utxoAmounts.map(v => new BigNumber(v));
        const result = selectTransparentInputs(
          utxos,
          new BigNumber(amount),
          false,
          "transparent-to-shielded",
        );

        expect(result).not.toBeUndefined();
        const outputCount = result!.changeAmount.gt(0) ? 2 : 1;
        const expectedFee = computeTransparentSelectionFee(
          utxos.length,
          outputCount,
          "transparent-to-shielded",
        );
        expect(result!.fee.toNumber()).toBe(expectedFee.toNumber());
      },
    );
  });
});

describe("selectTransparentInputs (transparent t→t)", () => {
  it("uses max(inputs, outputs) actions, not inputs + outputs (ZIP-317)", () => {
    // 2 inputs + recipient + change → logical_actions = max(2, 2) = 2 → 10_000
    // (the shielding formula would overcharge: computeZip317Fee(2 + 2) = 20_000).
    const result = selectTransparentInputs(
      [new BigNumber(716_548), new BigNumber(100_000)],
      new BigNumber(100_000),
      false,
      "transparent",
    );
    expect(result?.fee.toNumber()).toBe(10_000);
    // change = 816_548 - 100_000 - 10_000 = 706_548
    expect(result?.changeAmount.toNumber()).toBe(706_548);
    expect(result?.totalInput.toNumber()).toBe(816_548);
  });

  it("floors a single-input send at the 2-grace-action minimum", () => {
    const result = selectTransparentInputs(
      [new BigNumber(1_000_000)],
      new BigNumber(100_000),
      false,
      "transparent",
    );
    // 1 input + recipient + change → max(1, 2) = 2 → 10_000 (grace floor)
    expect(result?.fee.toNumber()).toBe(10_000);
    expect(result?.changeAmount.toNumber()).toBe(890_000);
  });

  it("does not inflate the fee by absorbing dust change (native owns change)", () => {
    // change = 1_000_000 - 987_000 - 10_000 = 3_000 (< 5_000 dust). For t→t the
    // fee must stay at the exact ZIP-317 value; the dust remains as change.
    const result = selectTransparentInputs(
      [new BigNumber(1_000_000)],
      new BigNumber(987_000),
      false,
      "transparent",
    );
    expect(result?.fee.toNumber()).toBe(10_000);
    expect(result?.changeAmount.toNumber()).toBe(3_000);
  });

  it("scales the fee with the input count for many UTXOs", () => {
    // 3 inputs + recipient + change → max(3, 2) = 3 → 15_000
    const result = selectTransparentInputs(
      [new BigNumber(400_000), new BigNumber(400_000), new BigNumber(400_000)],
      new BigNumber(100_000),
      false,
      "transparent",
    );
    expect(result?.fee.toNumber()).toBe(15_000);
    expect(result?.changeAmount.toNumber()).toBe(1_085_000);
  });

  it("computes useAllAmount fee with a single recipient output and no change", () => {
    const result = selectTransparentInputs(
      [new BigNumber(400_000), new BigNumber(400_000)],
      new BigNumber(0),
      true,
      "transparent",
    );
    // 2 inputs + 1 recipient output → max(2, 1) = 2 → 10_000; no change.
    expect(result?.fee.toNumber()).toBe(10_000);
    expect(result?.changeAmount.toNumber()).toBe(0);
  });
});

// ── estimateMaxSpendableTransparent ────────────────────────────────────

describe("estimateMaxSpendableTransparent", () => {
  it("returns 0 for an empty UTXO set", () => {
    expect(estimateMaxSpendableTransparent([], "transparent-to-shielded").toNumber()).toBe(0);
  });

  it("returns total minus the single-output shielding fee", () => {
    // 2 t-in + 1 Orchard recipient: orchard = max(2, 1) = 2; transparent = 2;
    // logical = 4 → 20_000.
    const result = estimateMaxSpendableTransparent(
      [new BigNumber(300_000), new BigNumber(300_000)],
      "transparent-to-shielded",
    );
    expect(result.toNumber()).toBe(580_000);
  });

  it("uses max(inputs, 1) actions for a transparent t→t send", () => {
    // 2 inputs + 1 recipient output → max(2, 1) = 2 → 10_000
    const result = estimateMaxSpendableTransparent(
      [new BigNumber(300_000), new BigNumber(300_000)],
      "transparent",
    );
    expect(result.toNumber()).toBe(590_000);
  });

  it("returns 0 when the fee exceeds the balance", () => {
    expect(
      estimateMaxSpendableTransparent([new BigNumber(5_000)], "transparent-to-shielded").toNumber(),
    ).toBe(0);
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
    // 2 spends, shielded-to-transparent: orchard = max(2, 2) = 2 actions;
    // transparent recipient = 1; logical = 3 → fee = 15_000.
    const result = estimateMaxSpendableAmount(notes, "shielded-to-transparent");
    expect(result.toNumber()).toBe(185_000); // 200_000 - 15_000
  });
});
