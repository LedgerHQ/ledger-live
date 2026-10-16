import { BigNumber } from "bignumber.js";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { FeeUnitLabel } from "../../../bridge/descriptor/types";
import { fees } from "./fees";

const feePerByteInput = fees.custom?.inputs.find(input => input.key === "feePerByte");
const feeRates = { slow: "2", medium: "5", fast: "10" };

const currencyWithUnits = (units: Array<{ code: string; magnitude: number }>) =>
  ({ units }) as unknown as CryptoOrTokenCurrency;

const labelFor = (label: FeeUnitLabel | undefined, currency: CryptoOrTokenCurrency) =>
  typeof label === "function" ? label(currency) : label;

describe("bitcoin fee descriptor", () => {
  it("declares presets, custom fees and coin control", () => {
    expect(fees.hasPresets).toBe(true);
    expect(fees.hasCustom).toBe(true);
    expect(fees.hasCoinControl).toBe(true);
    expect(fees.presets?.strategyLabelInAmount).toBe("legend");
    expect(fees.presets?.shouldEstimateWithBridge?.({})).toBe(true);
  });

  describe("fee rate unit", () => {
    const btc = currencyWithUnits([
      { code: "BTC", magnitude: 8 },
      { code: "sat", magnitude: 0 },
    ]);

    it("labels rates with the currency's base unit per vbyte", () => {
      expect(fees.presets?.legend?.type).toBe("feeRate");
      expect(labelFor(fees.presets?.legend?.unit, btc)).toBe("sat/vbyte");
      expect(labelFor(feePerByteInput?.unitLabel, btc)).toBe("sat/vbyte");
    });

    it("has no label when the currency has no base unit", () => {
      const noBaseUnit = currencyWithUnits([{ code: "BTC", magnitude: 8 }]);
      expect(labelFor(feePerByteInput?.unitLabel, noBaseUnit)).toBeUndefined();
    });
  });

  describe("presets.getOptions", () => {
    const getOptions = fees.presets!.getOptions!;

    it("lists the estimation's fee rates, slowest first", () => {
      expect(getOptions({ feeParameters: { feeRates } })).toEqual([
        { id: "slow", amount: new BigNumber(2) },
        { id: "medium", amount: new BigNumber(5) },
        { id: "fast", amount: new BigNumber(10) },
      ]);
    });

    it("skips the rates that are not valid decimal strings", () => {
      expect(
        getOptions({
          feeParameters: { feeRates: { slow: "", medium: 5, fast: "not-a-number" } },
        }),
      ).toEqual([]);
      expect(getOptions({ feeParameters: { feeRates: { slow: "1", fast: "Infinity" } } })).toEqual([
        { id: "slow", amount: new BigNumber(1) },
      ]);
    });

    it.each([
      ["a non-record transaction", undefined],
      ["a transaction without feeParameters", {}],
      ["non-record feeParameters", { feeParameters: "x" }],
      ["feeParameters without feeRates", { feeParameters: {} }],
      ["non-record feeRates", { feeParameters: { feeRates: null } }],
    ])("returns no option for %s", (_, transaction) => {
      expect(getOptions(transaction)).toEqual([]);
    });
  });

  describe("feePerByte suggestedRange", () => {
    const getRange = feePerByteInput!.suggestedRange!.getRange;

    it("spans the slowest to the fastest preset", () => {
      expect(getRange({ feeParameters: { feeRates } })).toEqual({ min: "2", max: "10" });
    });

    it("returns null without presets", () => {
      expect(getRange({ feeParameters: {} })).toBeNull();
      expect(getRange(undefined)).toBeNull();
    });
  });

  describe("feePerByte minValue", () => {
    const getValue = feePerByteInput!.minValue!.getValue;

    it("returns the relay fee floor of the estimation when present", () => {
      expect(getValue({ feeParameters: { relayFeePerByte: "3" } })).toBe("3");
    });

    it("returns null when relayFeePerByte is 0 (no misleading minimum)", () => {
      expect(getValue({ feeParameters: { relayFeePerByte: "0" } })).toBeNull();
    });

    it("returns null when the estimation has no relay fee (no floor enforced)", () => {
      expect(getValue({ feeParameters: { feeRates } })).toBeNull();
    });

    it("returns null when feeParameters is missing", () => {
      expect(getValue({})).toBeNull();
    });

    it("returns null for a non-record transaction", () => {
      expect(getValue(undefined)).toBeNull();
    });
  });

  describe("custom.getInitialValues", () => {
    const getInitialValues = fees.custom!.getInitialValues;

    it("prefills the custom rate the user chose", () => {
      expect(
        getInitialValues({
          familySpecificData: { feePerByte: "7" },
          feeParameters: { feePerByte: "4", feeRates },
        }),
      ).toEqual({ feePerByte: "7" });
    });

    it("prefills the rate in use, not a custom one left over from before a preset was picked", () => {
      expect(
        getInitialValues({
          feesStrategy: "fast",
          familySpecificData: { feePerByte: "7" },
          feeParameters: { feePerByte: "6", feeRates },
        }),
      ).toEqual({ feePerByte: "6" });
      expect(
        getInitialValues({
          feesStrategy: "custom",
          familySpecificData: { feePerByte: "7" },
          feeParameters: { feePerByte: "6", feeRates },
        }),
      ).toEqual({ feePerByte: "7" });
    });

    it("falls back to the estimated rate when there is no positive custom rate", () => {
      expect(
        getInitialValues({
          familySpecificData: { feePerByte: "0" },
          feeParameters: { feePerByte: "4", feeRates },
        }),
      ).toEqual({ feePerByte: "4" });
    });

    it("falls back to the medium preset when there is no positive estimated rate", () => {
      expect(getInitialValues({ feeParameters: { feePerByte: "0", feeRates } })).toEqual({
        feePerByte: "5",
      });
    });

    it("returns an empty value when nothing is known", () => {
      expect(getInitialValues({ feeParameters: { feeRates: { slow: "1", fast: "3" } } })).toEqual({
        feePerByte: "",
      });
      expect(getInitialValues({ familySpecificData: null })).toEqual({ feePerByte: "" });
      expect(getInitialValues(undefined)).toEqual({ feePerByte: "" });
    });
  });

  describe("custom.buildTransactionPatch", () => {
    const buildTransactionPatch = fees.custom!.buildTransactionPatch;

    it("sets the custom strategy with the rate rounded down to a whole sat/vB", () => {
      expect(buildTransactionPatch({ feePerByte: "12.9" })).toEqual({
        feesStrategy: "custom",
        familySpecificData: { feePerByte: "12" },
      });
    });

    it.each([
      ["not a number", "abc"],
      ["negative", "-1"],
    ])("sets a zero rate when the value is %s", (_, feePerByte) => {
      expect(buildTransactionPatch({ feePerByte })).toEqual({
        feesStrategy: "custom",
        familySpecificData: { feePerByte: "0" },
      });
    });

    it("keeps the transaction's other user choices", () => {
      const utxoStrategy = { strategy: 3, excludeUTXOs: [{ hash: "aa", outputIndex: 1 }] };
      expect(
        buildTransactionPatch(
          { feePerByte: "8" },
          { familySpecificData: { utxoStrategy, opReturnData: "deadbeef", feePerByte: "2" } },
        ),
      ).toEqual({
        feesStrategy: "custom",
        familySpecificData: { utxoStrategy, opReturnData: "deadbeef", feePerByte: "8" },
      });
    });
  });
});
