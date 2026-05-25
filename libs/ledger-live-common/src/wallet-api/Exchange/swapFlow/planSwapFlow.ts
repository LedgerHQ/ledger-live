import BigNumber from "bignumber.js";
import type { EIP712Message } from "@ledgerhq/types-live";
import { isDexExecutionProvider, type DexBuildContext } from "../dex";
import { toEIP712Message } from "../intents/signPermit2Evm/permit2";
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
  const tokenAllowance = quote.quoteDetails.tokenAllowance;
  return Boolean(
    quote.quoteDetails.tags?.isTokenApprovalRequired &&
      tokenAllowance &&
      !tokenAllowance.isApproved,
  );
}

/**
 * Returns the approval transaction blob to broadcast when the wallet
 * needs to drive an ERC-20 approval before the swap, or `null` when no
 * approval is needed.
 *
 * Distinct from {@link quoteNeedsApproval}: this returns `null` if the
 * quote *says* approval is required but did not ship the matching
 * transaction blob. The planner uses {@link quoteNeedsApproval} to
 * detect that mismatch and refuse to silently downgrade to a direct swap.
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
 * Mirrors `apps/live-app/src/executeSwap/helpers.ts#isRfq`. RFQ quotes
 * (UniswapX, 1inch-Fusion, Velora-Fusion) need an off-chain order
 * signing + relay-fill path which the wallet doesn't yet implement
 * (Task 8 Shape B). Today they're routed to `kind: "skip"` so the
 * live-app can fall through to its legacy execution path instead of
 * silently mis-routing into `direct-swap` / `approval-then-swap`.
 */
function isRfqQuote(quote: Quote): boolean {
  const isUniswapX = quote.providerDetails?.isUniswapX === true;
  if (isUniswapX && !quoteNeedsApproval(quote)) {
    return true;
  }
  if (
    quote.provider === "oneinchfusion" &&
    Boolean(
      (quote.customFields as Record<string, unknown> | undefined)?.quoteResponse,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Mirrors `determineFlowSteps.hasPermitData` for non-RFQ classic AMM
 * quotes that ship a Permit2 typed-data payload. These need an EIP-712
 * signing step inserted between approval (if any) and the swap calldata
 * build, with the resulting signature plumbed into
 * {@link DexBuildContext.permitSignature}.
 */
function getPermitTypedData(quote: Quote): EIP712Message | null {
  if (isRfqQuote(quote)) return null;
  const typedData = quote.quoteDetails.permitData?.typedData;
  if (!typedData) return null;
  return toEIP712Message(typedData);
}

/**
 * Pure planner: takes a quote + already-resolved account context and
 * returns the wallet-side device-intent phases that should run.
 *
 * The output mirrors the live-app `determineFlowSteps()` logical step
 * vocabulary mapped onto the wallet-side phase set we can drive today:
 *
 * - `approve_token` → `signApproval` + `broadcastApproval`
 * - `sign_permit`   → `signPermit2`
 * - `swap`          → `buildSwap` + `signSwap` + `broadcastSwap`
 *
 * RFQ and revoke flows fall back to `skip` — Task 8 widens this once
 * the matching wallet intents land. Throws if the planner-side
 * Permit2 normalisation fails (caller wraps in try/catch and rejects
 * the live-app `customSwap` promise).
 */
export function planSwapFlow(input: PlanSwapFlowInput): SwapFlowPlan {
  const { quote } = input;

  if (isRfqQuote(quote)) {
    return { kind: "skip", reason: "rfq-not-supported" };
  }

  const candidate = {
    provider: quote.provider,
    providerType: quote.providerDetails?.type,
  };
  const approvalTransaction = getApprovalTransaction(quote);
  const permitTypedData = getPermitTypedData(quote);

  if (isDexExecutionProvider(candidate)) {
    // Quote claims approval is required but did not ship the blob —
    // refuse to silently downgrade to a direct swap.
    if (quoteNeedsApproval(quote) && !approvalTransaction) {
      return { kind: "skip", reason: "dex-approval-blob-missing" };
    }

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

    if (approvalTransaction && permitTypedData) {
      return {
        kind: "approval-then-permit-then-swap",
        approvalTransaction,
        permitTypedData,
        provider: candidate.provider,
        buildContext,
      };
    }

    if (approvalTransaction) {
      return {
        kind: "approval-then-swap",
        approvalTransaction,
        provider: candidate.provider,
        buildContext,
      };
    }

    if (permitTypedData) {
      return {
        kind: "permit-then-swap",
        permitTypedData,
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
