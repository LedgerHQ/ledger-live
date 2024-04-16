import marketHandlers from "./market";

export const ALLOWED_UNHANDLED_REQUESTS = [
  "ledger.statuspage.io",
  "cdn.live.ledger.com/announcements",
  "swap.ledger.com/v5/currencies/all",
];

export default [...marketHandlers];
