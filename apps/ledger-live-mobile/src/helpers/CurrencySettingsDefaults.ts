import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { ConfirmationDefaults, UnitDefaults } from "../types/common";

export const currencySettingsDefaults = (c: Currency): ConfirmationDefaults & UnitDefaults => {
  let confirmationsNb;

  if (c.type === "CryptoCurrency") {
    const { blockAvgTime } = c;

    if (blockAvgTime) {
      const def = Math.ceil((30 * 60) / blockAvgTime); // 30 min approx validation

      confirmationsNb = {
        min: 1,
        def,
        max: 3 * def,
      };
    }
  }

  return {
    confirmationsNb,
    unit: c.units[0],
  };
};
