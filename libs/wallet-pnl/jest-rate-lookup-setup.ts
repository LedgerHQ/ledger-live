import { calculate, historyKey, inferCurrencyAPIID } from "@domain/entity-market-countervalues";
import { setRateLookup } from "./src/rateLookup";

// The suite exercises real conversions, so it registers the real implementation the way a
// host app does, rather than a stub.
setRateLookup({ calculate, historyKey, currencyApiId: inferCurrencyAPIID });
