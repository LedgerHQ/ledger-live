import BigNumber from "bignumber.js";

// TODO(LIVE-39206): remove once SwapKit returns the Hyperliquid fee in the quote.
export const PERPS_WITHDRAW_HYPERLIQUID_FEE_USDC = new BigNumber(1);

export type WithdrawTrack = (event: string, properties: Record<string, string>) => void;

/** Where the withdraw execution reports its events, and what they all carry. */
export type WithdrawAnalytics = Readonly<{
  track: WithdrawTrack;
  properties: Record<string, string>;
}>;

/** Relative to `SWAP_API_BASE` (`/v5`). */
export const PERPS_WITHDRAW_SUBMIT_PATH = "/swapkit_hyperliquid/submit";
