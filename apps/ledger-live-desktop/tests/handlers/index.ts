import MarketHandlers from "./market";
import CryptoIconsHandlers from "./cryptoIcons";
import CounterValuesHandlers from "./countervalues";
import AssetsHandlers from "./assets";
import FearAndGreedHandlers from "./fearAndGreed";

export default [
  ...MarketHandlers,
  ...CryptoIconsHandlers,
  ...CounterValuesHandlers,
  ...AssetsHandlers,
  ...FearAndGreedHandlers,
];
