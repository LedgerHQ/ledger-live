import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { getCurrencyConfiguration } from "../../config";

/** The `config_currency_<id>` coin config of a bitcoin-family currency, read at call time. */
export const getBitcoinCoinConfig = (currencyId: string): BitcoinCoinConfig =>
  getCurrencyConfiguration<BitcoinCoinConfig>(currencyId);
