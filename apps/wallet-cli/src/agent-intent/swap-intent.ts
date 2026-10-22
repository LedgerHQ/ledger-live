import { BigNumber } from "bignumber.js";
import type { SwapIntent } from "@ledgerhq/agent-intent-sdk";
import type { SwapAsset } from "./token-lookup";

/**
 * Swap API providers the Agent Intent frontend can turn into a transaction today: the DEXes it has
 * an endpoint for, and LI.FI through the generic `/swap`. Uniswap (Permit2) and deposit-address
 * providers such as Changelly stay blocked there, and a Swap it can't prepare stays `created`
 * with no way to reject it, so wallet-cli never proposes one.
 */
export const AGENT_INTENT_SWAP_PROVIDERS = ["oneinch", "velora", "okx", "lifi"] as const;

const PROVIDER_ALIAS: Record<string, string> = { "1inch": "oneinch" };

// The service's `NaturalAmount`: positive decimal text, no sign, exponent or leading zeros.
const NATURAL_AMOUNT_RE = /^(?!0(?:\.0+)?$)(?:0|[1-9]\d*)(?:\.\d+)?$/;

/** Everything `agent-intent swap` validated and quoted, before (or without, for --dry-run)
 * submitting it. Amounts are human-unit decimal text, as the service signs them. */
export type SwapIntentSummary = {
  profileId: string;
  environment: "staging" | "production";
  sender: string;
  from: SwapAsset;
  to: SwapAsset;
  fromAmount: string;
  toAmount: string;
  provider: string;
  /** False when `--to-amount` replaced the quote. */
  quoted: boolean;
  description?: string;
};

export function resolveAgentSwapProvider(provider: string): string {
  const resolved = PROVIDER_ALIAS[provider] ?? provider;
  if (!(AGENT_INTENT_SWAP_PROVIDERS as readonly string[]).includes(resolved)) {
    throw new Error(
      `--provider "${provider}" can't be reviewed in the Agent Intent frontend yet. Use one of ` +
        `${AGENT_INTENT_SWAP_PROVIDERS.join(", ")}.`,
    );
  }
  return resolved;
}

/** Validates a typed amount as the service's decimal text, within the asset's precision. */
export function parseSwapAmount(value: string, asset: SwapAsset, flag: string): string {
  if (!NATURAL_AMOUNT_RE.test(value)) {
    throw new Error(
      `--${flag} "${value}" is not a positive decimal amount such as 0.5 or 1250 (no sign, ` +
        "exponent, separators or leading zeros).",
    );
  }
  const fraction = value.split(".")[1] ?? "";
  if (fraction.length > asset.decimals) {
    throw new Error(
      `--${flag} ${value} has more than ${asset.decimals} decimal places, the precision of ` +
        `${asset.ticker}.`,
    );
  }
  return value;
}

/**
 * A quote's receive amount (a JS number in human units) as the service's decimal text: no
 * exponent, rounded down to the asset's precision so the agent never promises more than quoted.
 * `null` when nothing is left after rounding.
 */
export function quotedReceiveAmount(amount: number, asset: SwapAsset): string | null {
  const rounded = new BigNumber(amount).decimalPlaces(asset.decimals, BigNumber.ROUND_DOWN);
  if (!rounded.isFinite() || rounded.lte(0)) return null;
  return rounded.toFixed();
}

export function toSdkSwapIntent(summary: SwapIntentSummary): SwapIntent {
  return {
    type: "swap",
    network: "ethereum",
    sender: summary.sender,
    fromAsset: summary.from.id,
    toAsset: summary.to.id,
    fromAmount: summary.fromAmount,
    toAmount: summary.toAmount,
    provider: summary.provider,
    ...(summary.description ? { description: summary.description } : {}),
  };
}
