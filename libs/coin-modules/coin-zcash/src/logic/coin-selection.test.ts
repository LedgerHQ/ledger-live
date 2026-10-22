import BigNumber from "bignumber.js";
import {
  LEGACY_MARGINAL_FEE,
  ZIP2009_MARGINAL_FEE,
  ZIP2009_MAINNET_HEIGHT,
  ZIP2009_SWITCH_MARGIN,
  marginalFeeAt,
  marginalFeeFor,
  zip317MinimumFee,
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
import type { ZcashAccount, ZcashTransferType } from "../types/bridge";
import type { ZcashConfig } from "../config";

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
    expect(computeZip317Fee(0, 0, 0, 0, LEGACY_MARGINAL_FEE).toNumber()).toBe(10_000);
  });

  it("floors the Orchard pool to 2 actions (1 spend + 1 orchard out → 10_000)", () => {
    expect(computeZip317Fee(1, 1, 0, 0, LEGACY_MARGINAL_FEE).toNumber()).toBe(10_000);
  });

  it("adds the transparent leg on top of the Orchard floor (1 spend + 1 t-out → 15_000)", () => {
    // orchard = max(2, max(1,0)) = 2; transparent = max(0,1) = 1; logical = 3.
    expect(computeZip317Fee(1, 0, 0, 1, LEGACY_MARGINAL_FEE).toNumber()).toBe(15_000);
  });

  it("adds a transparent input on top of the Orchard floor (1 orchard out + 1 t-in → 15_000)", () => {
    // orchard = max(2, max(0,1)) = 2; transparent = max(1,0) = 1; logical = 3.
    expect(computeZip317Fee(0, 1, 1, 0, LEGACY_MARGINAL_FEE).toNumber()).toBe(15_000);
  });

  it("uses max(t_in, t_out) for a transparent-only layout", () => {
    expect(computeZip317Fee(0, 0, 1, 1, LEGACY_MARGINAL_FEE).toNumber()).toBe(10_000); // max(1,1)=1 → grace
    expect(computeZip317Fee(0, 0, 2, 1, LEGACY_MARGINAL_FEE).toNumber()).toBe(10_000); // max(2,1)=2 → grace
    expect(computeZip317Fee(0, 0, 3, 1, LEGACY_MARGINAL_FEE).toNumber()).toBe(15_000); // max(3,1)=3
  });

  it("scales the Orchard pool past the floor", () => {
    expect(computeZip317Fee(3, 3, 0, 0, LEGACY_MARGINAL_FEE).toNumber()).toBe(15_000);
    expect(computeZip317Fee(10, 10, 0, 0, LEGACY_MARGINAL_FEE).toNumber()).toBe(50_000);
  });
});

// ── computeShieldedSpendFee ─────────────────────────────────────────────

describe("computeShieldedSpendFee", () => {
  it("floors the Orchard bundle at 2 actions for shielded (grace minimum)", () => {
    expect(computeShieldedSpendFee(1, false, "shielded", LEGACY_MARGINAL_FEE).toNumber()).toBe(
      10_000,
    );
    expect(computeShieldedSpendFee(1, true, "shielded", LEGACY_MARGINAL_FEE).toNumber()).toBe(
      10_000,
    );
    expect(computeShieldedSpendFee(2, true, "shielded", LEGACY_MARGINAL_FEE).toNumber()).toBe(
      10_000,
    );
  });

  it("scales the Orchard bundle past the floor for shielded", () => {
    // 3 spends + recipient + change = max(3, 2) orchard actions → 15_000.
    expect(computeShieldedSpendFee(3, true, "shielded", LEGACY_MARGINAL_FEE).toNumber()).toBe(
      15_000,
    );
  });

  it("adds the transparent recipient leg for shielded-to-transparent (1 spend → 15_000)", () => {
    // orchard = max(2, max(1,0)) = 2; transparent recipient = 1; logical = 3.
    expect(
      computeShieldedSpendFee(1, false, "shielded-to-transparent", LEGACY_MARGINAL_FEE).toNumber(),
    ).toBe(15_000);
    // A shielded change note does not raise the fee (Orchard floor already 2).
    expect(
      computeShieldedSpendFee(1, true, "shielded-to-transparent", LEGACY_MARGINAL_FEE).toNumber(),
    ).toBe(15_000);
  });

  it("scales with the spend count for shielded-to-transparent (2 spends → 15_000)", () => {
    // orchard = max(2, max(2,0)) = 2; transparent recipient = 1; logical = 3.
    expect(
      computeShieldedSpendFee(2, false, "shielded-to-transparent", LEGACY_MARGINAL_FEE).toNumber(),
    ).toBe(15_000);
    // 3 spends: orchard = 3; + transparent recipient = 4 → 20_000.
    expect(
      computeShieldedSpendFee(3, false, "shielded-to-transparent", LEGACY_MARGINAL_FEE).toNumber(),
    ).toBe(20_000);
  });
});

// ── selectNotes ────────────────────────────────────────────────────────

describe("selectNotes", () => {
  it("selects 1 large note with 2-action fee and correct change", () => {
    const notes = [makeNote({ amount: new BigNumber(1_000_000) })];
    const result = selectNotes(notes, new BigNumber(500_000), "shielded", LEGACY_MARGINAL_FEE);

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
    const result = selectNotes(notes, new BigNumber(400_000), "shielded", LEGACY_MARGINAL_FEE);

    // 3 notes of 200k each, amount 400k. max(3 spends, 2 outputs) = 3 actions, fee = 15k
    expect(result?.selectedNotes).toHaveLength(3);
    expect(result?.fee.toNumber()).toBe(15_000);
    expect(result?.totalInput.toNumber()).toBe(600_000);
    expect(result?.changeAmount.toNumber()).toBe(185_000);
  });

  it("returns undefined for insufficient balance", () => {
    const notes = [makeNote({ amount: new BigNumber(5_000) })];
    const result = selectNotes(notes, new BigNumber(100_000), "shielded", LEGACY_MARGINAL_FEE);

    expect(result).toBe(undefined);
  });

  it("returns undefined when no notes provided", () => {
    const result = selectNotes([], new BigNumber(1_000), "shielded", LEGACY_MARGINAL_FEE);
    expect(result).toBe(undefined);
  });

  it("handles exact amount matching (no change) — single note covers amount + fee exactly", () => {
    // 1 note, 1 recipient output = 2 actions minimum (grace), fee = 10_000
    // So: note amount = send_amount + 10_000 → changeAmount = 0
    const sendAmount = new BigNumber(90_000);
    const exactNote = makeNote({ amount: new BigNumber(100_000) }); // 100_000 = 90_000 + 10_000
    const result = selectNotes([exactNote], sendAmount, "shielded", LEGACY_MARGINAL_FEE);

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
    const result = selectNotes(notes, amount, "shielded", LEGACY_MARGINAL_FEE);

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
    const result = selectNotes(notes, new BigNumber(500_000), "shielded", LEGACY_MARGINAL_FEE);

    // Should pick the large note first (1 note is sufficient)
    expect(result?.selectedNotes).toHaveLength(1);
    expect(result?.selectedNotes[0].txid).toBe("large");
  });

  it("selects notes for shielded-to-transparent with transparent recipient fee leg", () => {
    const notes = [makeNote({ amount: new BigNumber(1_000_000) })];
    const result = selectNotes(
      notes,
      new BigNumber(500_000),
      "shielded-to-transparent",
      LEGACY_MARGINAL_FEE,
    );

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
        const result = selectNotes(notes, new BigNumber(amount), transferType, LEGACY_MARGINAL_FEE);

        expect(result).not.toBeUndefined();
        const hasChange = result!.changeAmount.gt(0);
        const expectedFee = computeShieldedSpendFee(
          result!.selectedNotes.length,
          hasChange,
          transferType,
          LEGACY_MARGINAL_FEE,
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
    const result = selectNotes(notes, new BigNumber(4_487_803), "shielded", LEGACY_MARGINAL_FEE);

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
    expect(computeShieldingFee(1, 1, LEGACY_MARGINAL_FEE).toNumber()).toBe(15_000);
    // 1 t-in + recipient + shielded change: orchard = max(2, 2) = 2; still 15_000.
    expect(computeShieldingFee(1, 2, LEGACY_MARGINAL_FEE).toNumber()).toBe(15_000);
    // 3 t-in + recipient + change: orchard = max(2, 2) = 2; transparent = 3;
    // logical = 5 → 25_000.
    expect(computeShieldingFee(3, 2, LEGACY_MARGINAL_FEE).toNumber()).toBe(25_000);
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
        expect(
          computeTransparentSelectionFee(
            inputCount,
            1,
            transferType,
            LEGACY_MARGINAL_FEE,
          ).toNumber(),
        ).toBe(
          computeTransparentSelectionFee(
            inputCount,
            2,
            transferType,
            LEGACY_MARGINAL_FEE,
          ).toNumber(),
        );
      }
    },
  );
});

// ── selectTransparentInputs ────────────────────────────────────────────

describe("selectTransparentInputs (transparent-to-shielded)", () => {
  it("returns undefined when there are no UTXOs", () => {
    expect(
      selectTransparentInputs(
        [],
        new BigNumber(1_000),
        false,
        "transparent-to-shielded",
        LEGACY_MARGINAL_FEE,
      ),
    ).toBe(undefined);
  });

  it("computes fee (with change) and change for a single UTXO", () => {
    const result = selectTransparentInputs(
      [new BigNumber(1_000_000)],
      new BigNumber(100_000),
      false,
      "transparent-to-shielded",
      LEGACY_MARGINAL_FEE,
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
        LEGACY_MARGINAL_FEE,
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
      LEGACY_MARGINAL_FEE,
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
        LEGACY_MARGINAL_FEE,
      ),
    ).toBe(undefined);
  });

  it("computes useAllAmount fee with a single recipient output and no change", () => {
    const result = selectTransparentInputs(
      [new BigNumber(1_000_000)],
      new BigNumber(0),
      true,
      "transparent-to-shielded",
      LEGACY_MARGINAL_FEE,
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
        LEGACY_MARGINAL_FEE,
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
          LEGACY_MARGINAL_FEE,
        );

        expect(result).not.toBeUndefined();
        const outputCount = result!.changeAmount.gt(0) ? 2 : 1;
        const expectedFee = computeTransparentSelectionFee(
          utxos.length,
          outputCount,
          "transparent-to-shielded",
          LEGACY_MARGINAL_FEE,
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
      LEGACY_MARGINAL_FEE,
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
      LEGACY_MARGINAL_FEE,
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
      LEGACY_MARGINAL_FEE,
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
      LEGACY_MARGINAL_FEE,
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
      LEGACY_MARGINAL_FEE,
    );
    // 2 inputs + 1 recipient output → max(2, 1) = 2 → 10_000; no change.
    expect(result?.fee.toNumber()).toBe(10_000);
    expect(result?.changeAmount.toNumber()).toBe(0);
  });
});

// ── estimateMaxSpendableTransparent ────────────────────────────────────

describe("estimateMaxSpendableTransparent", () => {
  it("returns 0 for an empty UTXO set", () => {
    expect(
      estimateMaxSpendableTransparent(
        [],
        "transparent-to-shielded",
        LEGACY_MARGINAL_FEE,
      ).toNumber(),
    ).toBe(0);
  });

  it("returns total minus the single-output shielding fee", () => {
    // 2 t-in + 1 Orchard recipient: orchard = max(2, 1) = 2; transparent = 2;
    // logical = 4 → 20_000.
    const result = estimateMaxSpendableTransparent(
      [new BigNumber(300_000), new BigNumber(300_000)],
      "transparent-to-shielded",
      LEGACY_MARGINAL_FEE,
    );
    expect(result.toNumber()).toBe(580_000);
  });

  it("uses max(inputs, 1) actions for a transparent t→t send", () => {
    // 2 inputs + 1 recipient output → max(2, 1) = 2 → 10_000
    const result = estimateMaxSpendableTransparent(
      [new BigNumber(300_000), new BigNumber(300_000)],
      "transparent",
      LEGACY_MARGINAL_FEE,
    );
    expect(result.toNumber()).toBe(590_000);
  });

  it("returns 0 when the fee exceeds the balance", () => {
    expect(
      estimateMaxSpendableTransparent(
        [new BigNumber(5_000)],
        "transparent-to-shielded",
        LEGACY_MARGINAL_FEE,
      ).toNumber(),
    ).toBe(0);
  });
});

// ── estimateMaxSpendableAmount ──────────────────────────────────────────

describe("estimateMaxSpendableAmount", () => {
  it("returns 0 for empty note set", () => {
    const result = estimateMaxSpendableAmount([], "shielded", LEGACY_MARGINAL_FEE);
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
    const result = estimateMaxSpendableAmount(notes, "shielded", LEGACY_MARGINAL_FEE);
    expect(result.toNumber()).toBe(585_000); // 600_000 - 15_000
  });

  it("returns total - fee(1 note, 1 output) for single note", () => {
    const notes = [makeNote({ amount: new BigNumber(100_000) })];
    // 1 spend, 1 output → max(1, 1) = 1 action, clamped to 2 (grace) → fee = 10_000
    const result = estimateMaxSpendableAmount(notes, "shielded", LEGACY_MARGINAL_FEE);
    expect(result.toNumber()).toBe(90_000);
  });

  it("returns 0 when fee >= total balance (very small balance)", () => {
    const notes = [makeNote({ amount: new BigNumber(5_000) })];
    // total = 5_000, fee = 10_000 (grace) → max(5_000 - 10_000, 0) = 0
    const result = estimateMaxSpendableAmount(notes, "shielded", LEGACY_MARGINAL_FEE);
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
    const result = estimateMaxSpendableAmount(
      notes,
      "shielded-to-transparent",
      LEGACY_MARGINAL_FEE,
    );
    expect(result.toNumber()).toBe(185_000); // 200_000 - 15_000
  });
});

// ── marginal fee (ZIP 2009) ─────────────────────────────────────────────
//
// Must match the builder's `standard_marginal_fee`: 5_000 per logical action
// before the mainnet switch height, 1_000 from it and at every height on a test
// network. The wallet applies the switch ZIP2009_SWITCH_MARGIN blocks late.

describe("marginalFeeAt", () => {
  const switchHeight = ZIP2009_MAINNET_HEIGHT + ZIP2009_SWITCH_MARGIN;

  it("pins the rule values", () => {
    expect(LEGACY_MARGINAL_FEE).toBe(5_000);
    expect(ZIP2009_MARGINAL_FEE).toBe(1_000);
    expect(ZIP2009_MAINNET_HEIGHT).toBe(3_590_000);
    expect(ZIP2009_SWITCH_MARGIN).toBe(100);
  });

  it("keeps the legacy fee far below the switch on mainnet", () => {
    expect(marginalFeeAt("mainnet", 0, ZIP2009_MAINNET_HEIGHT)).toBe(5_000);
    expect(marginalFeeAt("mainnet", 3_000_000, ZIP2009_MAINNET_HEIGHT)).toBe(5_000);
  });

  it("keeps the legacy fee between the switch height and the end of the margin", () => {
    expect(marginalFeeAt("mainnet", ZIP2009_MAINNET_HEIGHT, ZIP2009_MAINNET_HEIGHT)).toBe(5_000);
    expect(marginalFeeAt("mainnet", ZIP2009_MAINNET_HEIGHT + 1, ZIP2009_MAINNET_HEIGHT)).toBe(
      5_000,
    );
  });

  it("stays on the legacy fee just below the margin edge and leaves it at the edge", () => {
    // The target is the synced height + 1, so the edge is at switchHeight - 1.
    expect(marginalFeeAt("mainnet", switchHeight - 2, ZIP2009_MAINNET_HEIGHT)).toBe(5_000); // 3_590_098
    expect(marginalFeeAt("mainnet", switchHeight - 1, ZIP2009_MAINNET_HEIGHT)).toBe(1_000); // 3_590_099
    expect(marginalFeeAt("mainnet", switchHeight, ZIP2009_MAINNET_HEIGHT)).toBe(1_000);
  });

  it("uses the ZIP 2009 fee far past the switch", () => {
    expect(marginalFeeAt("mainnet", 4_500_000, ZIP2009_MAINNET_HEIGHT)).toBe(1_000);
  });

  it("uses the ZIP 2009 fee on a test network at every height", () => {
    expect(marginalFeeAt("testnet", 0, ZIP2009_MAINNET_HEIGHT)).toBe(1_000);
    expect(marginalFeeAt("testnet", 1_000_000, ZIP2009_MAINNET_HEIGHT)).toBe(1_000);
    expect(marginalFeeAt("testnet", 3_590_098, ZIP2009_MAINNET_HEIGHT)).toBe(1_000);
    expect(marginalFeeAt("testnet", 5_000_000, ZIP2009_MAINNET_HEIGHT)).toBe(1_000);
  });
});

describe("marginalFeeAt, configured switch height", () => {
  const DELAYED = 3_700_000;

  it("delays the switch to the configured height, plus the margin", () => {
    expect(marginalFeeAt("mainnet", 3_600_000, DELAYED)).toBe(5_000);
    expect(marginalFeeAt("mainnet", DELAYED + ZIP2009_SWITCH_MARGIN - 2, DELAYED)).toBe(5_000);
    expect(marginalFeeAt("mainnet", DELAYED + ZIP2009_SWITCH_MARGIN - 1, DELAYED)).toBe(1_000);
    expect(marginalFeeAt("mainnet", 4_500_000, DELAYED)).toBe(1_000);
  });

  it("never switches when the config disables it", () => {
    expect(marginalFeeAt("mainnet", 0, null)).toBe(5_000);
    expect(marginalFeeAt("mainnet", 3_600_000, null)).toBe(5_000);
    expect(marginalFeeAt("mainnet", 50_000_000, null)).toBe(5_000);
  });

  it("raises a height below the builder's own switch to it", () => {
    expect(marginalFeeAt("mainnet", 3_500_000, 3_500_000)).toBe(5_000);
    expect(marginalFeeAt("mainnet", 3_590_098, 3_500_000)).toBe(5_000);
    expect(marginalFeeAt("mainnet", 3_590_099, 3_500_000)).toBe(1_000);
  });

  it("is ignored on a test network", () => {
    expect(marginalFeeAt("testnet", 0, DELAYED)).toBe(1_000);
    expect(marginalFeeAt("testnet", 0, null)).toBe(1_000);
  });
});

const accountOf = (currencyId: string, blockHeight: number | undefined): ZcashAccount =>
  ({ currency: { id: currencyId }, blockHeight }) as unknown as ZcashAccount;

describe("marginalFeeFor", () => {
  it("reads the network from the currency and the height from the account", () => {
    expect(marginalFeeFor(accountOf("zcash", 3_590_098), undefined)).toBe(5_000);
    expect(marginalFeeFor(accountOf("zcash", 3_590_099), undefined)).toBe(1_000);
    expect(marginalFeeFor(accountOf("zcash_testnet", 0), undefined)).toBe(1_000);
  });

  it("prices regtest as mainnet, at the legacy fee for its low heights", () => {
    expect(marginalFeeFor(accountOf("zcash_regtest", 120), undefined)).toBe(5_000);
  });

  it("takes the switch height from the zip2009 setting, and the default when it is absent", () => {
    const delayed = { mainnetHeight: 3_700_000 };
    expect(marginalFeeFor(accountOf("zcash", 3_600_000), undefined)).toBe(1_000);
    expect(marginalFeeFor(accountOf("zcash", 3_600_000), delayed)).toBe(5_000);
    expect(marginalFeeFor(accountOf("zcash", 3_700_099), delayed)).toBe(1_000);
    expect(marginalFeeFor(accountOf("zcash", 4_500_000), { mainnetHeight: null })).toBe(5_000);
    expect(marginalFeeFor(accountOf("zcash", 3_590_099), { mainnetHeight: 3_500_000 })).toBe(1_000);
    expect(marginalFeeFor(accountOf("zcash_testnet", 0), delayed)).toBe(1_000);
  });

  it.each([
    ["null", null],
    ["without a height", {}],
    ["with a non-numeric height", { mainnetHeight: "3700000" }],
    ["with a non-finite height", { mainnetHeight: Number.NaN }],
  ])("falls back to the default switch height for a zip2009 setting %s", (_label, zip2009) => {
    const setting = zip2009 as unknown as ZcashConfig["zip2009"];
    expect(marginalFeeFor(accountOf("zcash", 3_590_098), setting)).toBe(5_000);
    expect(marginalFeeFor(accountOf("zcash", 3_590_099), setting)).toBe(1_000);
  });

  it("prices an account that has not synced a height at the legacy fee", () => {
    expect(marginalFeeFor(accountOf("zcash", undefined), undefined)).toBe(5_000);
  });
});

describe("zip317MinimumFee", () => {
  it("is two grace actions at the marginal fee", () => {
    expect(zip317MinimumFee(5_000)).toBe(10_000);
    expect(zip317MinimumFee(1_000)).toBe(2_000);
  });
});

describe("fees at the ZIP 2009 marginal fee", () => {
  it("prices a 1-in/2-out transparent layout at 2_000", () => {
    expect(computeZip317Fee(0, 0, 1, 2, 1_000).toNumber()).toBe(2_000);
  });

  it("prices every layout at a fifth of the legacy fee", () => {
    const layouts: [number, number, number, number][] = [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 1],
      [0, 1, 1, 0],
      [3, 3, 0, 0],
      [10, 10, 0, 0],
    ];
    for (const [a, b, c, d] of layouts) {
      expect(computeZip317Fee(a, b, c, d, LEGACY_MARGINAL_FEE).toNumber()).toBe(
        5 * computeZip317Fee(a, b, c, d, ZIP2009_MARGINAL_FEE).toNumber(),
      );
    }
  });

  it("prices shielded sends, shielding and transparent selection at 1_000 per action", () => {
    expect(computeShieldedSpendFee(1, true, "shielded", 1_000).toNumber()).toBe(2_000);
    expect(computeShieldedSpendFee(1, true, "shielded-to-transparent", 1_000).toNumber()).toBe(
      3_000,
    );
    expect(computeShieldingFee(1, 1, 1_000).toNumber()).toBe(3_000);
    expect(computeTransparentSelectionFee(3, 2, "transparent", 1_000).toNumber()).toBe(3_000);
  });

  it("selects transparent inputs with the lower fee and a larger change", () => {
    const result = selectTransparentInputs(
      [new BigNumber(1_000_000)],
      new BigNumber(100_000),
      false,
      "transparent",
      1_000,
    );
    expect(result?.fee.toNumber()).toBe(2_000);
    expect(result?.changeAmount.toNumber()).toBe(898_000);
  });

  it("estimates the max spendable transparent amount at the lower fee", () => {
    const utxos = [new BigNumber(300_000), new BigNumber(300_000)];
    expect(estimateMaxSpendableTransparent(utxos, "transparent", 1_000).toNumber()).toBe(598_000);
    expect(
      estimateMaxSpendableTransparent(utxos, "transparent-to-shielded", 1_000).toNumber(),
    ).toBe(596_000);
  });

  it("selects notes starting from the lower minimum fee", () => {
    const notes = [makeNote({ amount: new BigNumber(1_000_000) })];
    const result = selectNotes(notes, new BigNumber(500_000), "shielded", 1_000);
    expect(result?.fee.toNumber()).toBe(2_000);
    expect(result?.changeAmount.toNumber()).toBe(498_000);
  });

  it("estimates the max spendable shielded amount at the lower fee", () => {
    const notes = [makeNote({ amount: new BigNumber(100_000) })];
    expect(estimateMaxSpendableAmount(notes, "shielded", 1_000).toNumber()).toBe(98_000);
  });
});
