import BigNumber from "bignumber.js";
import { pnlPercentage } from "../percentage";
import { expectBN } from "./helpers/bn";

const bn = (n: number | string) => new BigNumber(n);

describe("pnlPercentage", () => {
  describe("returns (pnl / basis) × 100; sign mirrors PnL", () => {
    it.each<[number, number, number]>([
      [10, 100, 10],
      [25, 100, 25],
      [50, 200, 25],
      [200, 100, 200],
      [-300, 1000, -30],
      [0, 1000, 0],
    ])("pnl=%s, basis=%s → %s%%", (pnl, basis, expected) => {
      expectBN(pnlPercentage(bn(pnl), bn(basis))!).toEqualBN(expected);
    });

    it("brokerage-style trade view: PnL €5,571.98 / basis €15,050 → 37.02%", () => {
      expectBN(pnlPercentage(bn("5571.98"), bn("15050"))!).toBeCloseToBN("37.02", 2);
    });
  });

  describe("zero-basis guard: returns null (avoids NaN / Infinity)", () => {
    it.each<[number]>([[100], [-100], [0]])("pnl=%s, basis=0 → null", pnl => {
      expect(pnlPercentage(bn(pnl), bn(0))).toBeNull();
    });
  });

  describe("unit-agnostic: ratio is invariant under fiat-unit scaling", () => {
    it("(€5,646.984 / €15,000) ≡ (564,698.4¢ / 1,500,000¢)", () => {
      const inMajor = pnlPercentage(bn("5646.984"), bn("15000"))!;
      const inMinor = pnlPercentage(bn("564698.4"), bn("1500000"))!;
      expectBN(inMinor).toEqualBN(inMajor);
    });
  });
});
