import BigNumber from "bignumber.js";

// TODO(LIVE-39206): remove once SwapKit returns the Hyperliquid fee in the quote.
export const PERPS_WITHDRAW_HYPERLIQUID_FEE_USDC = new BigNumber(1);

// TODO(LIVE-39366): placeholder paths, confirm with the backend.
export const PERPS_WITHDRAW_ENDPOINTS = {
  currencies: "/ledger/hyperliquid/currencies",
  quote: "/withdraw/quote",
  payload: "/withdraw/payload",
  submit: "/withdraw/submit",
  status: "/ledger/hyperliquid/status",
} as const;
