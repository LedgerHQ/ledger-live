import { isCurrencySupported } from "../../currencies";
import allSpecs from "../../generated/specs";
import { AppSpec } from "../types";
import { SpecPerBot } from "./types";

export function getSpecsPerBots(
  seeds: Record<string, string>,
  filters: {
    currencies?: string | undefined;
    families?: string | undefined;
  } = {}
): SpecPerBot[] {
  const filterFamilies =
    filters.families
      ?.split(",")
      .map((f) => f.trim())
      .filter(Boolean) || [];

  const filterCurrencies =
    filters.currencies
      ?.split(",")
      .map((f) => f.trim())
      .filter(Boolean) || [];

  // allSpecs allows to know and infer what are the coins to sync
  const specs: Array<{ spec: AppSpec<any>; family: string; key: string }> = [];
  for (const family in allSpecs) {
    if (filterFamilies.length > 0 && !filterFamilies.includes(family)) continue;
    const familySpecs = allSpecs[family];
    for (const key in familySpecs) {
      const spec: AppSpec<any> = familySpecs[key];
      if (!isCurrencySupported(spec.currency) || spec.disabled) {
        continue;
      }
      if (
        filterCurrencies.length > 0 &&
        !filterCurrencies.includes(spec.currency.id)
      ) {
        continue;
      }
      specs.push({ spec, family, key });
    }
  }

  // prepare the jobs
  const specsPerBots = Object.keys(seeds).flatMap((seed, i) => {
    return specs.map(({ spec, family, key }, j) => {
      return {
        seed,
        env: {
          SEED: seeds[seed],
          SPECULOS_PID_OFFSET: String(i * specs.length + j),
        },
        spec,
        family,
        key,
      };
    });
  });

  return specsPerBots;
}
