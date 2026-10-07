import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/index";
import { BigNumber } from "bignumber.js";

export const SUN_PER_TRX = 1_000_000;
export const ONE_TRX = new BigNumber(SUN_PER_TRX);
export const STANDARD_FEES_NATIVE = new BigNumber(270000);
export const ACTIVATION_FEES = ONE_TRX.multipliedBy(1.1); // ONE TRX fee + 0.1 TRX activation cost
export const STANDARD_FEES_TRC_20 = ONE_TRX.multipliedBy(13.7409);

// The memo fee is a chain parameter (`getMemoFee`, TIP-387) read live from the chain; this is the
// pessimistic stand-in used only when chain parameters are unreachable, set to mainnet's 1 TRX.
export const MEMO_FEE_PESSIMISTIC = ONE_TRX;

// `withdrawBalance` claims the whole accrued reward and then locks the account for 24h. Read by both
// `validateIntent` (which rejects a premature claim) and `getStakes` (which offers `claim_reward`).
export const REWARD_WITHDRAW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// Fee-option ids surfaced by `listFeeOptions` and routed on by `estimateFees` (ADR-050 Option 3).
// Kept in this low-level constants module — not the `logic` barrel — so `api/index.ts` can import
// them without the `jest.mock("../logic")` in its tests blanking them out. `listFeeOptions` and the
// `estimateFees` routing must agree on these exact strings, or a user's selection silently falls
// back to the standard path.
export const STANDARD_FEE_OPTION_ID = "standard" as const;
export const TRONIFY_FEE_OPTION_ID = "tronify" as const;

// TRX's own unit and identity, used to format user-facing fee amounts in validation errors.
// Hardcoded rather than resolved from a CryptoCurrency: `logic/` must not reach into live-common's
// currency registry (coin-modules restricted imports), and these are fixed chain constants.
// Mirrors domain/entity/currency-crypto/src/currencies/tron.ts.
export const TRX_UNIT = { name: "TRX", code: "TRX", magnitude: 6 };
export const TRX_TICKER = "TRX";
export const TRX_CURRENCY_NAME = "Tron";

/** Energy-rent delivery poll cadence and hard timeout (ms). Tunable to Tronify's typical delivery time. */
export const ENERGY_RENT_POLL_INTERVAL_MS = 3_000;
export const ENERGY_RENT_POLL_TIMEOUT_MS = 120_000;

// The rental is already paid for by the time we poll, so a transient Tronify error must not abandon
// it. `network()` retries GETs only and Tronify's status call is a POST, so the tolerance lives here.
export const ENERGY_RENT_POLL_MAX_CONSECUTIVE_ERRORS = 5;

// Tronify builds payments that expire about a minute out. One valid for longer could be held and
// broadcast after the poll gave up and a retry paid again; the margin absorbs a skewed local clock.
export const ENERGY_RENT_PAYMENT_MAX_EXPIRY_MS = ENERGY_RENT_POLL_TIMEOUT_MS + 5 * 60_000;

// Tronify builds its payments with fee_limit 100 TRX, above the 50 TRX coin-tron gives its own
// TRC-20 transfers, so the payment needs its own bound.
export const ENERGY_RENT_PAYMENT_MAX_FEE_LIMIT = 100_000_000;

// About 1.5× what burning TRX for a USDT transfer to an empty recipient cost in October 2026
// (195k energy at 100 sun, TRX at $0.34), so a real rental clears it with room to spare.
export const DEFAULT_TRONIFY_MAX_RENT_AMOUNT = 10;

// Tronify's price can move between the Review quote and the order.
export const DEFAULT_TRONIFY_RENT_PRICE_MARGIN = 0.05;

/** What Tronify rent is paid in: coin-tron always sends `extraTrxNum`, which selects Tronify's USDT
 * payment ("Flow 2"). */
export const TRONIFY_PAY_ASSET = {
  type: "trc20",
  assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  name: "Tether USD",
  unit: { name: "USDT", code: "USDT", magnitude: 6 },
} as const;

/** A fresh copy per call, so a caller mutating the result never leaks into the shared constant. */
export function tronifyPayAsset(): AssetInfo {
  return { ...TRONIFY_PAY_ASSET, unit: { ...TRONIFY_PAY_ASSET.unit } };
}

/** A decimal USDT amount in USDT base units, rounded up so a sub-unit amount never under-states
 * the rent. NaN when `amount` does not parse. */
export function payAssetBaseUnits(amount: BigNumber.Value): BigNumber {
  return new BigNumber(amount)
    .shiftedBy(TRONIFY_PAY_ASSET.unit.magnitude)
    .integerValue(BigNumber.ROUND_CEIL);
}
