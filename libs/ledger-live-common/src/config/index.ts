import { ConfigInfo, LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { getLocalNodeConfig } from "../localNode";

export type CurrencyLiveConfigDefinition = Record<`config_currency_${string}`, ConfigInfo>;

/**
 * The single place currency configuration is read from: the coin-module `Context`
 * (`buildContext`) and every direct caller go through it, so a currency running on its local node
 * gets its local configuration everywhere.
 */
const getCurrencyConfiguration = <T extends CurrencyConfig>(
  currencyId: string,
): T & Record<string, unknown> => {
  const localNodeConfig = getLocalNodeConfig(currencyId);
  if (localNodeConfig) {
    return localNodeConfig as T & Record<string, unknown>;
  }

  const currencyData = LiveConfig.getValueByKey(`config_currency_${currencyId}`);
  if (!currencyData) {
    throw new Error(`No currency configuration available for ${currencyId}`);
  }

  return currencyData;
};

export { getCurrencyConfiguration };
