import MarketHandlers from "./market";
import CoingeckoHandlers from "./coingecko";
import CryptoIconsHandlers from "./cryptoIcons";
import CounterValuesHandlers from "./countervalues";
import AssetsHandlers from "./assets";
import FearAndGreedHandlers from "./fearAndGreed";
import ConcordiumHandlers from "./concordium";

export default [
  ...MarketHandlers,
  ...ConcordiumHandlers,
  ...CoingeckoHandlers,
  ...CryptoIconsHandlers,
  ...CounterValuesHandlers,
  ...AssetsHandlers,
  ...FearAndGreedHandlers,
];
