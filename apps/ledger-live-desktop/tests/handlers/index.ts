import NFTsHandlers from "./nfts";

export const ALLOWED_UNHANDLED_REQUESTS = [
  "ledger.statuspage.io",
  "cdn.live.ledger.com/announcements",
  "swap.ledger.com/v5/currencies/all",
];

export default [...NFTsHandlers];
