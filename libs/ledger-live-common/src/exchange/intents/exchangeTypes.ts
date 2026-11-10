import type { ExchangeTypes } from "@ledgerhq/hw-app-exchange";

/**
 * The exchange types of the Exchange app, as numbers.
 *
 * `ExchangeTypes` is a `const enum`: it only exists while tsc inlines it, so using it as a value
 * breaks wherever the sources are transformed file by file (jest, bundlers). The wallet-api's
 * `ExchangeType` carries the same values and is what the hooks receive anyway.
 */
export const EXCHANGE_TYPE = {
  swap: 0x00 as ExchangeTypes.Swap,
  sell: 0x01 as ExchangeTypes.Sell,
  fund: 0x02 as ExchangeTypes.Fund,
};
