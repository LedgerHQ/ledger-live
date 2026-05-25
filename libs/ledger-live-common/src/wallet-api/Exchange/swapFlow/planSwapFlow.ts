import BigNumber from "bignumber.js";
import { isDexExecutionProvider, type DexBuildContext } from "../dex";
import type {
  Quote,
  QuoteApprovalTransaction,
} from "../quotes/types";
import type { PlanSwapFlowInput, SwapFlowPlan } from "./types";

/**
 * Mirrors the swap-live-app approval predicate used by both the CTA and
 * `_stepMachine`:
 *   `isTokenApprovalRequired && tokenAllowance && !tokenAllowance.isApproved`
 *
 * Source of truth for the rule:
 * - `apps/live-app/src/executeSwap/helpers.ts#needsTokenApproval`
 * - `apps/live-app/src/app/multi-step-transaction/_stepMachine/utils/determineFlowSteps.ts`
 *
 * Re-implemented against the wallet-side `Quote` shape because that lives
 * under `quoteDetails.{tags,tokenAllowance}` rather than the live-app's
 * `tags` / `tokenAllowanceData` flat fields.
 */
export function quoteNeedsApproval(quote: Quote): boolean {
  return getApprovalTransaction(quote) !== null;
}

/**
 * Returns the approval transaction blob to broadcast when the wallet
 * needs to drive an ERC-20 approval before the swap, or `null` when no
 * approval is needed (or the quote is missing the matching transaction
 * blob, in which case we cannot drive approval from the wallet anyway).
 */
function getApprovalTransaction(
  quote: Quote,
): QuoteApprovalTransaction | null {
  const tokenAllowance = quote.quoteDetails.tokenAllowance;
  if (
    quote.quoteDetails.tags?.isTokenApprovalRequired &&
    tokenAllowance &&
    !tokenAllowance.isApproved &&
    tokenAllowance.approvalTransaction
  ) {
    return tokenAllowance.approvalTransaction;
  }
  return null;
}

/**
 * Pure planner: takes a quote + already-resolved account context and
 * returns the wallet-side device-intent phases that should run.
 *
 * The output mirrors the live-app `determineFlowSteps()` logical step
 * vocabulary mapped onto the wallet-side phase set we can drive today:
 *
 * - `approve_token` → `signApproval` + `broadcastApproval`
 * - `swap`          → `buildSwap` + `signSwap` + `broadcastSwap`
 *
 * Permit2, RFQ and revoke flows fall back to `skip` for now — Task 8 (and
 * later tasks) will widen this once the matching wallet intents land.
 */
export function planSwapFlow(input: PlanSwapFlowInput): SwapFlowPlan {
  const { quote } = input;
  const candidate = {
    provider: quote.provider,
    providerType: quote.providerDetails?.type,
  };
  const approvalTransaction = getApprovalTransaction(quote);

  if (isDexExecutionProvider(candidate)) {
    const buildContext: DexBuildContext = {
      customFields: quote.customFields,
      fromCurrencyId: input.fromCurrencyId,
      toCurrencyId: input.toCurrencyId,
      fromAccountAddress: input.fromAccountAddress,
      amountFrom: new BigNumber(quote.quoteDetails.sendAmount),
      slippage: quote.quoteDetails.slippage,
      gasLimitMultiplier: input.gasLimitMultiplier,
      defaultGasLimit: input.defaultGasLimit,
    };

    if (approvalTransaction) {
      return {
        kind: "approval-then-swap",
        approvalTransaction,
        provider: candidate.provider,
        buildContext,
      };
    }

    return {
      kind: "direct-swap",
      provider: candidate.provider,
      buildContext,
    };
  }

  if (!approvalTransaction) {
    const tokenAllowance = quote.quoteDetails.tokenAllowance;
    return {
      kind: "skip",
      reason: tokenAllowance?.isApproved
        ? "already-approved-non-dex"
        : "no-approval-non-dex",
    };
  }

  // approvalTransaction !== null && !isDex: sign + broadcast the approval,
  // then resolve so the live-app can run its legacy swap path.
  return {
    kind: "approval-only",
    approvalTransaction,
  };
}
