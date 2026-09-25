import { setRateLookup as setWalletPnlRateLookup } from "@ledgerhq/wallet-pnl";
import { calculate, historyKey, inferCurrencyAPIID } from "@domain/entity-market-countervalues";

// Mirrors setupRateLookups in src/live-common-setup.ts, which tests cannot import because it boots the app.
setWalletPnlRateLookup({ calculate, historyKey, currencyApiId: inferCurrencyAPIID });
