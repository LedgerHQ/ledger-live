import { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { ConfigInfo, LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type CurrencyLiveConfigDefinition = Partial<
  Record<`config_currency_${CryptoCurrencyId}`, ConfigInfo>
>;

const getCurrencyConfiguration = <T extends CurrencyConfig>(
  currency: CryptoCurrency,
): T & Record<string, unknown> => {
  const currencyData = LiveConfig.getValueByKey(`config_currency_${currency.id}`);
  if (!currencyData) {
    throw new Error(`No currency configuration available for ${currency.id}`);
  }

  return currencyData;
};

export { getCurrencyConfiguration };
