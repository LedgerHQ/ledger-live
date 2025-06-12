import NFTsHandlers from "./nfts";
import MarketHandlers from "./market";
import CryptoIconsHandlers from "./cryptoIcons";
import CounterValuesHandlers from "./countervalues";

export default [
  ...NFTsHandlers,
  ...MarketHandlers,
  ...CryptoIconsHandlers,
  ...CounterValuesHandlers,
];

export const ALLOWED_UNHANDLED_REQUESTS = [
  "https://nft.api.live.ledger.com/v2/marketdata/ethereum/1/contract/0xe3BE0054Da2F8da5002E8bdD8AA4c7fDf851E86D/floor-price",
  "https://nft.api.live.ledger.com/v2/ethereum/1/contracts/infos",
  "https://cloud-sync-backend.api.aws.stg.ldg-tech.com/_info",
  "https://trustchain-backend.api.aws.stg.ldg-tech.com/_info",
];
