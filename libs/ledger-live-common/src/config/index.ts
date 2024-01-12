import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrencyConfigCommon } from "./types";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

const getCurrencyConfiguration = (currency: CryptoCurrency): CurrencyConfigCommon => {
  const currencyData = LiveConfig.getValueByKey(`config_currency_${currency.id}`);
  if (!currencyData) {
    throw new Error(`No currency configuration available for ${currency.id}`);
  }
  return currencyData;
};

export { getCurrencyConfiguration };
