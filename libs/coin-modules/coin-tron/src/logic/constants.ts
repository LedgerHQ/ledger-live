import { BigNumber } from "bignumber.js";

export const ONE_TRX = new BigNumber(1000000);
export const STANDARD_FEES_NATIVE = new BigNumber(270000);
export const ACTIVATION_FEES = ONE_TRX.multipliedBy(1.1); // ONE TRX fee + 0.1 TRX activation cost
export const STANDARD_FEES_TRC_20 = ONE_TRX.multipliedBy(13.7409);

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
