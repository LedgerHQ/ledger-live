import MarketHandlers from "./market";
import CoingeckoHandlers from "./coingecko";
import CryptoIconsHandlers from "./cryptoIcons";
import CounterValuesHandlers from "./countervalues";
import AssetsHandlers from "./assets";
import FearAndGreedHandlers from "./fearAndGreed";
import AltcoinSeasonHandlers from "./altcoinSeason";
import ConcordiumHandlers from "./concordium";
import BuyHandlers from "./buy";
import SwapHandlers from "./swap";
import LedgerSyncHandlers from "./ledgerSync";

export default [
  ...MarketHandlers,
  ...ConcordiumHandlers,
  ...CoingeckoHandlers,
  ...CryptoIconsHandlers,
  ...CounterValuesHandlers,
  ...AssetsHandlers,
  ...FearAndGreedHandlers,
  ...AltcoinSeasonHandlers,
  ...BuyHandlers,
  ...SwapHandlers,
  ...LedgerSyncHandlers,
];
