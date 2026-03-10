import buildCoinConfig from "@ledgerhq/coin-framework/config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { ConcordiumCoinConfig } from "./types/config";

export type { ConcordiumCoinConfig } from "./types/config";

const { setCoinConfig, getCoinConfig: _getCoinConfig } = buildCoinConfig<ConcordiumCoinConfig>();

const getCoinConfig = (currencyId?: string): ConcordiumCoinConfig =>
  _getCoinConfig(currencyId ? ({ id: currencyId } as CryptoCurrency) : undefined);

export default { setCoinConfig, getCoinConfig };
