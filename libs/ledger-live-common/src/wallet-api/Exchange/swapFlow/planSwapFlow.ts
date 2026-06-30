import BigNumber from "bignumber.js";
import type { EIP712Message } from "@ledgerhq/types-live";
import { isDexExecutionProvider, type DexBuildContext } from "../dex";
import { toEIP712Message } from "../intents/signPermit2Evm/permit2";
import {
  toRfqEIP712Message,
  type RfqProvider,
} from "../intents/signRfqOrderEvm/rfqTypedData";
import type {
  Quote,
  QuoteApprovalTransaction,
} from "../quotes/types";
import type { PlanSwapFlowInput, SwapFlowPlan } from "./types";

/**
 * Providers known to require the USDT-on-Ethereum revoke-to-0 dance
 * before a non-zero allowance can be set.
 */
const PROVIDERS_THAT_NEED_USDT_REVOKE: ReadonlySet<string> = new Set([
  "thorswap",
  "lifi",
  "oneinchfusion",
  "oneinch",
  "velora",
  "okx",
]);

/** USDT-ERC20 atomic decimals (used to atomise the quote's `sendAmount`). */
const USDT_DECIMALS = 6;

/**
 * Mirrors the swap-live-app approval predicate used by both the CTA and
 * `_stepMachine`:
 *   `isTokenApprovalRequired && tokenAllowance && !tokenAllowance.isApproved`
 *
 * Source of truth: swap-live-app approval predicate (see LIVE-31887).
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
 * Identifies the RFQ provider for a quote, or `null` for classic AMM /
 * non-RFQ quotes. Mirrors swap-live-app RFQ classification rules (see LIVE-31887).
 *
 * Unlike the previous `isRfqQuote` predicate, this also returns the
 * provider tag for UniswapX quotes that still need a token approval —
 * those run an `approval-then-rfq-order` plan rather than the classic
 * `approval-then-swap` AMM path (mirrors live-app `determineFlowSteps`
 * which only short-circuits on `executionFlowType === "rfq"`).
 *
 * `oneinchfusion` is always RFQ regardless of `customFields` shape — the
 * live-app classifies it the same way (see `quoteHelpers#computeLiquiditySource`).
 * If the typed-data payload is missing at execution time `buildRfqPlan`
 * surfaces a `rfq-typed-data-missing` skip rather than misrouting into a
 * non-RFQ branch.
 */
function getRfqProvider(quote: Quote): RfqProvider | null {
  if (quote.providerDetails?.isUniswapX === true) {
    return "uniswapx";
  }
  if (quote.provider === "oneinchfusion") {
    return "oneinchfusion";
  }
  return null;
}

/**
 * Mirrors `determineFlowSteps.hasPermitData` for non-RFQ classic AMM
 * quotes that ship a Permit2 typed-data payload. These need an EIP-712
 * signing step inserted between approval (if any) and the swap calldata
 * build, with the resulting signature plumbed into
 * {@link DexBuildContext.permitSignature}.
 */
function getPermitTypedData(quote: Quote): EIP712Message | null {
  if (getRfqProvider(quote) !== null) return null;
  const typedData = quote.quoteDetails.permitData?.typedData;
  if (!typedData) return null;
  return toEIP712Message(typedData);
}

/**
 * Build the submit-endpoint body for an RFQ provider. Mirrors the
 * `getCustomFieldsOverrides` adapters in the live-app:
 * - UniswapX appends `routing: "DUTCH_V2"`;
 * - 1inch Fusion forwards `customFields` verbatim.
 *
 * The wallet-side machine splices in the `signature` field once the
 * device signs the order, so the planner returns the body without it.
 */
function buildRfqSubmitBody(
  quote: Quote,
  provider: RfqProvider,
): Record<string, unknown> {
  const customFields = quote.customFields ?? {};
  if (provider === "uniswapx") {
    return { ...customFields, routing: "DUTCH_V2" };
  }
  return { ...customFields };
}

function buildRfqPlan(
  quote: Quote,
  rfqProvider: RfqProvider,
  approvalTransaction: QuoteApprovalTransaction | null,
): SwapFlowPlan {
  const typedData = quote.quoteDetails.permitData?.typedData;
  if (!typedData) {
    return { kind: "skip", reason: "rfq-typed-data-missing" };
  }
  const orderTypedData = toRfqEIP712Message(typedData, rfqProvider);
  const submitBody = buildRfqSubmitBody(quote, rfqProvider);
  const network = quote.quoteDetails.networkFees.currencyId;
  const precomputedOrderId =
    rfqProvider === "oneinchfusion"
      ? quote.quoteDetails.permitData?.orderHash
      : undefined;

  if (approvalTransaction) {
    return {
      kind: "approval-then-rfq-order",
      approvalTransaction,
      rfqProvider,
      provider: quote.provider,
      orderTypedData,
      submitBody,
      precomputedOrderId,
      network,
    };
  }
  return {
    kind: "rfq-order",
    rfqProvider,
    provider: quote.provider,
    orderTypedData,
    submitBody,
    precomputedOrderId,
    network,
  };
}

/**
 * Detects the USDT-on-Ethereum revoke edge case. Mirrors the live-app
 * predicate (`apps/live-app/src/utils/revoke.ts#isUSDTRevokeNeeded`):
 * for the providers in {@link PROVIDERS_THAT_NEED_USDT_REVOKE}, a USDT
 * allowance that is non-zero but smaller than the swap amount must
 * first be revoked to 0 before a new approval can be set, because
 * USDT's ERC-20 implementation reverts a non-zero `approve` over an
 * existing non-zero allowance.
 *
 * Wallet-side does not yet prepend a `revoke` device-intent step, so
 * we surface this as a `skip` reason and let the live-app fall back
 * to its classic swap path (which handles the revoke flow today).
 */
function needsUsdtRevoke(
  quote: Quote,
  fromCurrencyTicker: string | undefined,
  fromCurrencyParentId: string | undefined,
): boolean {
  if (!PROVIDERS_THAT_NEED_USDT_REVOKE.has(quote.provider)) return false;
  if (fromCurrencyTicker !== "USDT") return false;
  if (fromCurrencyParentId !== "ethereum") return false;

  const tokenAllowance = quote.quoteDetails.tokenAllowance;
  if (!tokenAllowance) return false;
  if (tokenAllowance.isApproved) return false;
  const approvedAmount = new BigNumber(tokenAllowance.approvedAmount ?? 0);
  if (approvedAmount.isZero()) return false;

  // `sendAmount` is in display units (e.g. `350` USDT); atomise it
  // before comparing against the on-chain allowance (atomic units).
  const sendAmountAtomic = new BigNumber(
    quote.quoteDetails.sendAmount,
  ).shiftedBy(USDT_DECIMALS);

  return sendAmountAtomic.gt(approvedAmount);
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
 * - RFQ `swap`      → `signRfqOrder` + `submitRfqOrder`
 *
 * Throws if the planner-side EIP-712 normalisation fails (caller wraps
 * in try/catch and rejects the live-app `customSwap` promise).
 */
export function planSwapFlow(input: PlanSwapFlowInput): SwapFlowPlan {
  const { quote } = input;

  if (
    needsUsdtRevoke(quote, input.fromCurrencyTicker, input.fromCurrencyParentId)
  ) {
    return { kind: "skip", reason: "usdt-revoke-needed" };
  }

  const approvalTransaction = getApprovalTransaction(quote);
  const rfqProvider = getRfqProvider(quote);

  if (rfqProvider !== null) {
    if (quoteNeedsApproval(quote) && !approvalTransaction) {
      return { kind: "skip", reason: "dex-approval-blob-missing" };
    }
    return buildRfqPlan(quote, rfqProvider, approvalTransaction);
  }

  const candidate = {
    provider: quote.provider,
    providerType: quote.providerDetails?.type,
  };
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
