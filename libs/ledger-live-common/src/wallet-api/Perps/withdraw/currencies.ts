import { fetchCurrencyTo } from "../../../exchange/swap/api/v5/fetchCurrencyTo";
import { HYPERCORE_CURRENCY_ID, PERPS_SWAPKIT_PROVIDER } from "../constants";

/** Ledger Wallet currency ids SwapKit can swap HyperCore USDC into. */
export function fetchPerpsWithdrawCurrencies(): Promise<string[]> {
  return fetchCurrencyTo({
    currencyFromId: HYPERCORE_CURRENCY_ID,
    providers: [PERPS_SWAPKIT_PROVIDER],
  });
}
