/**
 * Re-exports ramp catalog helpers used by MVVM features.
 * Implementation lives under `renderer/screens/market` for legacy Market UI;
 * import from here in `src/mvvm` to avoid scattering `~/renderer/...` paths.
 */
export {
  isAvailableOnBuy,
  isAvailableOnSell,
  type MarketCurrencyRampLedgerIds,
} from "~/renderer/screens/market/utils";
