import MarketHandlers from "./market";
import CoingeckoHandlers from "./coingecko";
import CryptoIconsHandlers from "./cryptoIcons";
import CounterValuesHandlers from "./countervalues";
import AssetsHandlers from "./assets";
import FearAndGreedHandlers from "./fearAndGreed";
import ConcordiumHandlers from "./concordium";
import BuyHandlers from "./buy";
import SwapHandlers from "./swap";

export default [
  ...MarketHandlers,
  ...ConcordiumHandlers,
  ...CoingeckoHandlers,
  ...CryptoIconsHandlers,
  ...CounterValuesHandlers,
  ...AssetsHandlers,
  ...FearAndGreedHandlers,
  ...BuyHandlers,
  ...SwapHandlers,
];
