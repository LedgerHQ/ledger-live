/**
 * Decide whether this platform should run a broadcast-gated swap flow.
 *
 * On broadcast nightlies iOS+Android share the same on-chain account, so running both can race on
 * allowance/nonce. We pin each flow to one platform per run and rotate assignments.
 * See: https://ledgerhq.atlassian.net/browse/QAA-1411
 */

const PLATFORM_SLOTS = ["ios", "android"] as const;

export const BroadcastFlow = { APPROVAL: 0, REAPPROVAL: 1 } as const;
export type BroadcastFlow = (typeof BroadcastFlow)[keyof typeof BroadcastFlow];

const MONDAY_EPOCH_UTC_MS = Date.UTC(2024, 0, 1);
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function currentPlatform(): (typeof PLATFORM_SLOTS)[number] {
  return process.env.DETOX_CONFIGURATION?.startsWith("ios") ? "ios" : "android";
}

function broadcastRotationIndex(): number {
  if (process.env.GITHUB_EVENT_NAME === "schedule") {
    return Math.floor((Date.now() - MONDAY_EPOCH_UTC_MS) / ONE_WEEK_MS);
  }
  return Number.parseInt(process.env.GITHUB_RUN_NUMBER ?? "0", 10) || 0;
}

/**
 * Whether a broadcast flow should run in THIS platform's job on this run:
 *  - broadcast off                  → no (these flows are Monday-nightly / enable_broadcast only)
 *  - broadcast on, one platform     → yes (a single-platform run owns the account alone)
 *  - broadcast on, both platforms   → only on the flow's assigned platform this run (rotated)
 *
 * `E2E_BOTH_PLATFORMS` is set by the workflow to `tests_type != 'iOS Only' && != 'Android Only'`
 * — i.e. whether both platform jobs run this workflow (the only case that can collide).
 */
export function shouldRunBroadcastFlow(flow: BroadcastFlow): boolean {
  if (process.env.DISABLE_TRANSACTION_BROADCAST !== "0") return false;
  if (process.env.E2E_BOTH_PLATFORMS !== "true") return true;

  const assigned = PLATFORM_SLOTS[(broadcastRotationIndex() + flow) % PLATFORM_SLOTS.length];
  return currentPlatform() === assigned;
}
