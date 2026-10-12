import { BigNumber } from "bignumber.js";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { FeeDescriptor } from "../../../bridge/descriptor/types";
import type { BitcoinFamilySpecificData, BitcoinFeeParametersJson } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getFeePerVByteUnit(currency: CryptoOrTokenCurrency): string | undefined {
  const unit = currency.units.find(unit => unit.magnitude === 0);
  return unit ? `${unit.code}/vbyte` : undefined;
}

// Read defensively: the descriptor is handed an `unknown` transaction.
const feeParametersOf = (transaction: unknown): BitcoinFeeParametersJson =>
  isRecord(transaction) && isRecord(transaction.feeParameters)
    ? (transaction.feeParameters as BitcoinFeeParametersJson)
    : {};

const familySpecificDataOf = (transaction: unknown): BitcoinFamilySpecificData =>
  isRecord(transaction) && isRecord(transaction.familySpecificData)
    ? (transaction.familySpecificData as BitcoinFamilySpecificData)
    : {};

const toRate = (value: unknown): BigNumber | null => {
  if (typeof value !== "string" || value === "") return null;
  const rate = new BigNumber(value);
  return rate.isFinite() ? rate : null;
};

/** The network presets of the last estimation, fastest first. */
function feeRatesOf(transaction: unknown): Array<{ speed: string; feePerByte: BigNumber }> {
  const rates = feeParametersOf(transaction).feeRates;
  if (!isRecord(rates)) return [];
  return (["fast", "medium", "slow"] as const).flatMap(speed => {
    const feePerByte = toRate(rates[speed]);
    return feePerByte ? [{ speed, feePerByte }] : [];
  });
}

export const fees: FeeDescriptor = {
  hasPresets: true,
  hasCustom: true,
  hasCoinControl: true,
  presets: {
    legend: { type: "feeRate", unit: getFeePerVByteUnit, valueFrom: "presetAmount" },
    strategyLabelInAmount: "legend",
    getOptions: transaction =>
      [...feeRatesOf(transaction)]
        .reverse()
        .map(item => ({ id: item.speed, amount: item.feePerByte })),
    shouldEstimateWithBridge: () => true,
  },
  custom: {
    inputs: [
      {
        key: "feePerByte",
        type: "number",
        unitLabel: getFeePerVByteUnit,
        suggestedRange: {
          getRange: transaction => {
            const rates = feeRatesOf(transaction).map(item => item.feePerByte);
            if (rates.length === 0) return null;
            return {
              min: BigNumber.min(...rates).toFixed(),
              max: BigNumber.max(...rates).toFixed(),
            };
          },
        },
        minValue: {
          getValue: transaction => {
            const relay = toRate(feeParametersOf(transaction).relayFeePerByte);
            return relay?.gt(0) ? relay.toFixed() : null;
          },
        },
      },
    ],
    getInitialValues: (transaction): Record<string, string> => {
      // a rate in familySpecificData is in use with the custom strategy (or none) only: one left
      // over from before a preset was picked is not
      const strategy = isRecord(transaction) ? transaction.feesStrategy : undefined;
      const custom =
        !strategy || strategy === "custom"
          ? toRate(familySpecificDataOf(transaction).feePerByte)
          : null;
      if (custom?.gt(0)) return { feePerByte: custom.toFixed() };
      const estimated = toRate(feeParametersOf(transaction).feePerByte);
      if (estimated?.gt(0)) return { feePerByte: estimated.toFixed() };
      const medium = feeRatesOf(transaction).find(item => item.speed === "medium");
      return { feePerByte: medium ? medium.feePerByte.toFixed() : "" };
    },
    buildTransactionPatch: (values, transaction) => {
      const feePerByte = new BigNumber(values.feePerByte);
      const rate =
        feePerByte.isNaN() || feePerByte.isNegative()
          ? new BigNumber(0)
          : feePerByte.integerValue(BigNumber.ROUND_DOWN);
      return {
        feesStrategy: "custom",
        // the patch is merged shallowly: keep the other user choices (coin control, OP_RETURN…)
        familySpecificData: { ...familySpecificDataOf(transaction), feePerByte: rate.toFixed() },
      };
    },
  },
};
