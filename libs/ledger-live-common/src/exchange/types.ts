import { ExchangeSell, ExchangeSellRaw } from "./platform/types";
import { ExchangeSwap, ExchangeSwapRaw } from "./swap/types";

export type Exchange = ExchangeSwap | ExchangeSell;
export function isExchangeSwap(exchange: Exchange): exchange is ExchangeSwap {
  return "toAccount" in exchange;
}

export type ExchangeRaw = ExchangeSwapRaw | ExchangeSellRaw;
