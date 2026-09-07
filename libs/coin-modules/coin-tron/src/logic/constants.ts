import { BigNumber } from "bignumber.js";

export const ONE_TRX = new BigNumber(1000000);
export const STANDARD_FEES_NATIVE = new BigNumber(270000);
export const ACTIVATION_FEES = ONE_TRX.multipliedBy(1.1); // ONE TRX fee + 0.1 TRX activation cost
export const STANDARD_FEES_TRC_20 = ONE_TRX.multipliedBy(13.7409);

// The memo fee is a chain parameter (`getMemoFee`, TIP-387) read live from the chain; this is the
// pessimistic stand-in used only when chain parameters are unreachable, set to mainnet's 1 TRX.
export const MEMO_FEE_PESSIMISTIC = ONE_TRX;

// `withdrawBalance` claims the whole accrued reward and then locks the account for 24h. Read by both
// `validateIntent` (which rejects a premature claim) and `getStakes` (which offers `claim_reward`).
export const REWARD_WITHDRAW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// TRX's own unit and identity, used to format user-facing fee amounts in validation errors.
// Hardcoded rather than resolved from a CryptoCurrency: `logic/` must not reach into live-common's
// currency registry (coin-modules restricted imports), and these are fixed chain constants.
// Mirrors domain/entity/currency-crypto/src/currencies/tron.ts.
export const TRX_UNIT = { name: "TRX", code: "TRX", magnitude: 6 };
export const TRX_TICKER = "TRX";
export const TRX_CURRENCY_NAME = "Tron";
