import { BigNumber } from "bignumber.js";
import {
  defaultUtxoStrategy,
  getFamilySpecificData,
  getFeeParameters,
  getFeePerByte,
  getUtxoStrategy,
} from "./types";

describe("transaction helpers", () => {
  it("read the user choices and the estimation, empty when missing", () => {
    expect(getFamilySpecificData({})).toEqual({});
    expect(getFamilySpecificData({ familySpecificData: { rbf: true } })).toEqual({ rbf: true });
    expect(getFeeParameters({})).toEqual({});
    expect(getFeeParameters({ feeParameters: { feePerByte: "3" } })).toEqual({ feePerByte: "3" });
  });

  it("prefer the estimated rate to the custom one", () => {
    expect(
      getFeePerByte({
        feeParameters: { feePerByte: "7" },
        familySpecificData: { feePerByte: "9" },
      }),
    ).toEqual(new BigNumber(7));
    expect(getFeePerByte({ familySpecificData: { feePerByte: "9" } })).toEqual(new BigNumber(9));
  });

  it.each([undefined, null, "", "not-a-number"])("read a rate of %j as unknown", rate => {
    expect(getFeePerByte({ feeParameters: { feePerByte: rate } as never })).toBeNull();
  });

  it("default the coin selection to deep outputs first, without exclusions", () => {
    expect(defaultUtxoStrategy()).toEqual({ strategy: 0, excludeUTXOs: [] });
    expect(getUtxoStrategy({})).toEqual(defaultUtxoStrategy());
    const utxoStrategy = { strategy: 2 as const, excludeUTXOs: [{ hash: "h", outputIndex: 0 }] };
    expect(getUtxoStrategy({ familySpecificData: { utxoStrategy } })).toBe(utxoStrategy);
  });
});
