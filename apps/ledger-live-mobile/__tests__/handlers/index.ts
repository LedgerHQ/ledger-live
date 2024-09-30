import marketHandlers from "./market";
import ledgerSyncHandlers from "./ledgerSync";

export const ALLOWED_UNHANDLED_REQUESTS = [
  "ledger.statuspage.io",
  "cdn.live.ledger.com/announcements",
  "swap.ledger.com/v5/currencies/all",
  "https://cdn.live.ledger.com/swap-providers/data.json",
  "https://crypto-assets-service.api.ledger.com/v1/partners?output=name,signature,public_key,public_key_curve&service_name=swap",
];

export default [...marketHandlers, ...ledgerSyncHandlers];
