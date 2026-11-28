import BigNumber from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";
import { delegationAmountCell } from "../delegationAmountCell";

const SOL: Unit = { name: "SOL", code: "SOL", magnitude: 9 };
const ADA: Unit = { name: "ADA", code: "ADA", magnitude: 6 };

const baseUnits = (value: number) => new BigNumber(value);

describe("delegationAmountCell", () => {
  it("shows an amount below 0.0001 as <0.0001 and keeps the exact value for the tooltip", () => {
    expect(delegationAmountCell(SOL, baseUnits(13_492))).toEqual({
      value: "<0.0001 SOL",
      tooltip: "0.000013492 SOL",
      sensitive: true,
    });
  });

  it("rounds an amount down to 4 decimals and keeps the exact value for the tooltip", () => {
    expect(delegationAmountCell(SOL, baseUnits(10_132_072))).toEqual({
      value: "0.0101 SOL",
      tooltip: "0.010132072 SOL",
      sensitive: true,
    });
    expect(delegationAmountCell(SOL, baseUnits(7_399_999))).toEqual({
      value: "0.0073 SOL",
      tooltip: "0.007399999 SOL",
      sensitive: true,
    });
  });

  it("shows an amount with at most 4 decimals as is, without tooltip", () => {
    expect(delegationAmountCell(SOL, baseUnits(100_000))).toEqual({
      value: "0.0001 SOL",
      sensitive: true,
    });
    expect(delegationAmountCell(SOL, baseUnits(2_000_000_000))).toEqual({
      value: "2 SOL",
      sensitive: true,
    });
  });

  it("shows zero as zero", () => {
    expect(delegationAmountCell(SOL, baseUnits(0))).toEqual({ value: "0 SOL", sensitive: true });
  });

  it("applies the 4 decimals in the unit of the account", () => {
    expect(delegationAmountCell(ADA, baseUnits(99))).toEqual({
      value: "<0.0001 ADA",
      tooltip: "0.000099 ADA",
      sensitive: true,
    });
    expect(delegationAmountCell(ADA, baseUnits(1_234_567))).toEqual({
      value: "1.2345 ADA",
      tooltip: "1.234567 ADA",
      sensitive: true,
    });
  });
});
