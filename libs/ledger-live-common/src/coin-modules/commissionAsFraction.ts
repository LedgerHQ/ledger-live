import type { Validator } from "@ledgerhq/coin-module-framework/api/types";

/** A validator whose `commissionRate` counts `unitsPerWhole` to 100% (100 for a percentage), its rate as a fraction of 1. */
export const commissionAsFraction =
  (unitsPerWhole: number) =>
  (validator: Validator): Validator =>
    validator.commissionRate === undefined
      ? validator
      : { ...validator, commissionRate: String(Number(validator.commissionRate) / unitsPerWhole) };
