/**
 * Mapping from live-app manifest ID to its PageHeader translation key.
 * Only apps listed here will display a PageHeader in Wallet 4.0.
 */
const WALLET40_HEADER_BY_APP_ID = {
  "buy-sell-ui": "exchange.pageHeader",
} as const satisfies Record<string, string>;

type Wallet40AppId = keyof typeof WALLET40_HEADER_BY_APP_ID;

const isWallet40App = (manifestId: string): manifestId is Wallet40AppId =>
  manifestId in WALLET40_HEADER_BY_APP_ID;

export const getWallet40HeaderKey = (manifestId: string): string | undefined =>
  isWallet40App(manifestId) ? WALLET40_HEADER_BY_APP_ID[manifestId] : undefined;
