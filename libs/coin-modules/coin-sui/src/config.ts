import { type CurrencyConfig } from "@ledgerhq/coin-framework/config";
import buildCoinConfig from "@ledgerhq/coin-framework/config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type SuiConfig = {
  node: {
    url: string;
  };
};

export type SuiCoinConfig = CurrencyConfig & SuiConfig;

const { setCoinConfig, getCoinConfig: _getCoinConfig } = buildCoinConfig<SuiCoinConfig>();

const getCoinConfig = (currencyId?: string): SuiCoinConfig =>
  _getCoinConfig(currencyId ? ({ id: currencyId } as CryptoCurrency) : undefined);

export default { setCoinConfig, getCoinConfig };
