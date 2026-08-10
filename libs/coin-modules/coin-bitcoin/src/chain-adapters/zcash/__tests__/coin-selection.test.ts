import { computeZip317Fee } from "../coin-selection";

// ── computeZip317Fee ───────────────────────────────────────────────────
//
// Mirrors the Rust `zip317_fee` unit tests (craft.rs): the Orchard pool is
// floored to 2 actions independently of the transparent pool. This is the
// only pricing model coin-bitcoin still owns for Zcash — it feeds
// transparent-fee-rate.ts, the ZIP-317 pricer of the legacy transparent PSBT
// path (the shielded/PCZT selection algorithms live in @ledgerhq/coin-zcash).

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
