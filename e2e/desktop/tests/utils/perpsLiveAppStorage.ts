import { getWalletApiIdFromAccountId } from "@ledgerhq/live-common/wallet-api/converters";

// Matches the Hyperliquid account in the perps-migrated-account userdata.
export const PERPS_HYPERCORE_ACCOUNT_ID =
  "js:2:hypercore:0x0000000000000000000000000000000000000000:";

export const getPerpsLiveAppStorage = (accountId: string): Record<string, string> => ({
  firstTimeDone: "true",
  globalDisclaimer: JSON.stringify({ hasAccepted: true }),
  hip3Disclaimer: JSON.stringify({ hasAccepted: true }),
  currentAccountId: getWalletApiIdFromAccountId(accountId),
});
