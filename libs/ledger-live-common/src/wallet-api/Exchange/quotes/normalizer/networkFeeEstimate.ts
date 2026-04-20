import BigNumber from "bignumber.js";

import type {
  QuoteApprovalNetworkFee,
  QuoteEstimatedNetworkFee,
} from "@ledgerhq/wallet-api-exchange-module";

import type { RawQuote } from "../service/types";
import { isGasLess } from "./quoteHelpers";

/** Extra gas limit consumed by an EVM token-approval transaction. */
export const APPROVAL_GAS_LIMIT = 60_000;

/**
 * Per-chain fee overrides in non-atomic units. Used for chains whose
 * bridges don't expose `gasPrice` / `maxFeePerGas` so the EVM formula
 * doesn't apply. Solana: 0.003 SOL covers base fees plus the SPL
 * receiver ATA rent-exemption.
 */
const CHAIN_FEE_OVERRIDES_NON_ATOMIC: Record<string, BigNumber> = {
  solana: new BigNumber("0.003"),
};

/**
 * Default-strategy fee context built once per `getQuotes` invocation.
 * Monetary fields are atomic units of the fee currency.
 */
export type NetworkFeeContext = {
  maxFeePerGas?: BigNumber;
  gasPrice?: BigNumber;
  defaultGasLimit?: string;
  /** Bridge-reported total estimate, used as fallback when no gas price is available. */
  estimatedFeesAtomic: BigNumber;
  balanceAtomic: BigNumber;
  feeCurrencyId: string;
  feeCurrencyMagnitude: number;
  /** Kept separate from `feeCurrencyId` so the chain-override table can evolve independently. */
  mainAccountCurrencyId: string;
};

export type FeeEstimate = {
  estimatedNetworkFee?: QuoteEstimatedNetworkFee;
  approvalNetworkFee?: QuoteApprovalNetworkFee;
  notEnoughBalance: boolean;
};

/**
 * Compute the wallet-side network-fee estimate for a raw quote. Emits
 * `estimatedNetworkFee` (base swap gas) and `approvalNetworkFee`
 * (pre-swap ERC-20 approval gas) when applicable; either is undefined
 * for gasless quotes, override-chain rows, or rows without an approval.
 */
export function computeFeeEstimate(quote: RawQuote, context: NetworkFeeContext): FeeEstimate {
  const gasLess = isGasLess(quote);
  const needsApproval = quote.tokenAllowanceData?.isApproved === false;

  const override = CHAIN_FEE_OVERRIDES_NON_ATOMIC[context.mainAccountCurrencyId];
  if (override !== undefined) {
    return computeOverrideFeeEstimate(quote, context, override, gasLess);
  }

  const effectiveGasPrice = pickGasPrice(context);

  // Gasless RFQ quotes carry no base swap gas; only the approval portion remains.
  const baseGasLimit = gasLess
    ? new BigNumber(0)
    : new BigNumber(quote.networkFees.gasLimit ?? context.defaultGasLimit ?? 0);
  const approvalGasLimit = needsApproval ? new BigNumber(APPROVAL_GAS_LIMIT) : new BigNumber(0);

  let baseFeeAtomic: BigNumber;
  let approvalFeeAtomic: BigNumber;

  if (effectiveGasPrice?.gt(0)) {
    baseFeeAtomic = baseGasLimit.multipliedBy(effectiveGasPrice);
    approvalFeeAtomic = approvalGasLimit.multipliedBy(effectiveGasPrice);
  } else {
    // No gas price available: fall back to the bridge-reported estimate
    // for base; approval gas is unknowable without a price.
    baseFeeAtomic = gasLess ? new BigNumber(0) : context.estimatedFeesAtomic;
    approvalFeeAtomic = new BigNumber(0);
  }

  const totalAtomic = baseFeeAtomic.plus(approvalFeeAtomic);

  return {
    estimatedNetworkFee: toAtomicFeeField(baseFeeAtomic, context.feeCurrencyId),
    approvalNetworkFee: toAtomicFeeField(approvalFeeAtomic, context.feeCurrencyId),
    notEnoughBalance:
      shouldCheckBalance(quote, needsApproval) && context.balanceAtomic.lt(totalAtomic),
  };
}

/**
 * Per-chain override branch: pays exactly the hardcoded amount for a real
 * swap, nothing for gasless rows, and never emits `approvalNetworkFee`.
 */
function computeOverrideFeeEstimate(
  quote: RawQuote,
  context: NetworkFeeContext,
  overrideNonAtomic: BigNumber,
  gasLess: boolean,
): FeeEstimate {
  const overrideAtomic = overrideNonAtomic.shiftedBy(context.feeCurrencyMagnitude);
  const baseFeeAtomic = gasLess ? new BigNumber(0) : overrideAtomic;
  const needsApproval = quote.tokenAllowanceData?.isApproved === false;

  return {
    estimatedNetworkFee: toAtomicFeeField(baseFeeAtomic, context.feeCurrencyId),
    approvalNetworkFee: undefined,
    notEnoughBalance:
      shouldCheckBalance(quote, needsApproval) && context.balanceAtomic.lt(baseFeeAtomic),
  };
}

function pickGasPrice(context: NetworkFeeContext): BigNumber | undefined {
  if (context.maxFeePerGas?.gt(0)) {
    return context.maxFeePerGas;
  }
  if (context.gasPrice?.gt(0)) {
    return context.gasPrice;
  }
  return undefined;
}

/**
 * Skip the balance check for quotes with zero network fees and no
 * approval requirement (RFQ swap of an already-approved token has no
 * on-chain cost). `needsApproval` mirrors the signal used to compute
 * `approvalNetworkFee` so the gate stays consistent with the fee fields
 * we emit even if the backend ever ships `tokenAllowanceData.isApproved`
 * without setting `tags.isTokenApprovalRequired`.
 */
function shouldCheckBalance(quote: RawQuote, needsApproval: boolean): boolean {
  return (
    (quote.networkFees.value ?? 0) !== 0 ||
    needsApproval ||
    quote.tags.isTokenApprovalRequired === true
  );
}

function toAtomicFeeField(
  amount: BigNumber,
  currencyId: string,
): QuoteEstimatedNetworkFee | undefined {
  if (!amount.gt(0)) {
    return undefined;
  }
  return { amount: amount.toFixed(0), currencyId };
}
