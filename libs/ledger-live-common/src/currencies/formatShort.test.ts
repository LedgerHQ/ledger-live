import BigNumber from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";
import { formatShort } from "./formatShort";

const unit = (magnitude: number): Unit => ({ name: "Test", code: "TST", magnitude });

describe("formatShort", () => {
  it("formats large values concisely", () => {
    expect(formatShort(unit(8), new BigNumber("1500000000000"))).toBe("15k");
  });

  it("returns 0 for zero", () => {
    expect(formatShort(unit(8), new BigNumber(0))).toBe("0");
  });

  it("scales by magnitude 24", () => {
    expect(formatShort(unit(24), new BigNumber("1500000000000000000000000000"))).toBe("1.5k");
    expect(formatShort(unit(24), new BigNumber("-1500000000000000000000000000"))).toBe("-1.5k");
  });
});
