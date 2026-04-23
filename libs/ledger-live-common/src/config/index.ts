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

export { getCurrencyConfiguration };
