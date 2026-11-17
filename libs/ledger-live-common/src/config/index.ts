import { ConfigInfo, LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type CurrencyLiveConfigDefinition = Record<`config_currency_${string}`, ConfigInfo>;

const getCurrencyConfiguration = <T extends CurrencyConfig>(
  currencyId: string,
): T & Record<string, unknown> => {
  const currencyData = LiveConfig.getValueByKey(`config_currency_${currencyId}`);
  if (!currencyData) {
    throw new Error(`No currency configuration available for ${currencyId}`);
  }

  return currencyData;
};

/** Wraps the defaults exported by a coin package (keyed by currency id) for LiveConfig. */
const currencyDefaultsToLiveConfig = (
  defaults: Record<string, Record<string, unknown>>,
): CurrencyLiveConfigDefinition =>
  Object.fromEntries(
    Object.entries(defaults).map(([currencyId, config]) => [
      `config_currency_${currencyId}`,
      { type: "object" as const, default: config },
    ]),
  );

export { getCurrencyConfiguration, currencyDefaultsToLiveConfig };
