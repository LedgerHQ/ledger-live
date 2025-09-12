import MarketHandlers from "./market";
import CryptoIconsHandlers from "./cryptoIcons";
import CounterValuesHandlers from "./countervalues";
import AssetsHandlers from "./assets";

export default [
  ...MarketHandlers,
  ...CryptoIconsHandlers,
  ...CounterValuesHandlers,
  ...AssetsHandlers,
];

export const ALLOWED_UNHANDLED_REQUESTS = [
  "https://cloud-sync-backend.api.aws.stg.ldg-tech.com/_info",
  "https://trustchain-backend.api.aws.stg.ldg-tech.com/_info",
];
