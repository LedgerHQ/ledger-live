import type { FeeStrategy, SendIntent } from "@ledgerhq/agent-intent-sdk";

export const FEE_STRATEGIES = ["slow", "medium", "fast"] as const satisfies readonly FeeStrategy[];
// `satisfies` only rules out extra values; this fails to compile if the SDK adds a strategy the
// list above doesn't offer (same check as AGENT_INTENT_ENVIRONMENTS in session-store.ts).
type AssertTrue<T extends true> = T;
type _FeeStrategiesExhaustive = AssertTrue<
  FeeStrategy extends (typeof FEE_STRATEGIES)[number] ? true : false
>;

export type IntentAsset =
  | { type: "native"; ticker: string; decimals: number }
  | { type: "erc20"; ticker: string; decimals: number; contract: string };

/** Everything `agent-intent send` validated, before (or without, for --dry-run) submitting it. */
export type SendIntentSummary = {
  profileId: string;
  environment: "staging" | "production";
  sender: string;
  recipient: string;
  asset: IntentAsset;
  /** Exact base-unit integer, as decimal digits (never a JS number). */
  amount: string;
  /** The amount as the user typed it, for display only. */
  displayAmount: string;
  feeStrategy: FeeStrategy;
  description?: string;
};

export function toSdkSendIntent(summary: SendIntentSummary): SendIntent {
  return {
    type: "send",
    network: "ethereum",
    sender: summary.sender,
    recipient: summary.recipient,
    amount: summary.amount,
    asset:
      summary.asset.type === "native"
        ? { type: "native" }
        : { type: "erc20", assetReference: summary.asset.contract },
    feeStrategy: summary.feeStrategy,
    ...(summary.description ? { description: summary.description } : {}),
  };
}

/** The service answers with `<frontend>/intents/<id>`; returns that id, or null for any other
 * shape (the intent exists either way — see `agent-intent send`). */
export function intentIdFromDeeplink(deeplink: string): string | null {
  try {
    const match = /\/intents\/([^/]+)\/?$/.exec(new URL(deeplink).pathname);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}
