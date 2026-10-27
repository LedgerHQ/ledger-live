export type CurrencyNoticeId = "robinhoodDisclaimer" | "perps";

export const CURRENCY_NOTICES: Readonly<Record<string, readonly CurrencyNoticeId[]>> = {
  robinhood: ["robinhoodDisclaimer"],
  robinhood_testnet: ["robinhoodDisclaimer"],
  hypercore: ["perps"],
};
