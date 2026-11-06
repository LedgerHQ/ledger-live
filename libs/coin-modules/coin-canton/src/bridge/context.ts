import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { log } from "@ledgerhq/logs";
import coinConfig, { type CantonCoinConfig, type CantonContext } from "../config";

export const getBridgeConfig = (currency: CryptoCurrency): CantonCoinConfig =>
  coinConfig.getCoinConfig(currency.id);

export const getBridgeContext = (currency: CryptoCurrency): CantonContext => ({
  config: async () => getBridgeConfig(currency),
  logger: (...args: unknown[]) => log("debug", args.join(" ")),
});
