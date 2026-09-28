/**
 * Decide whether this platform should run a flow that mutates a shared on-chain account.
 *
 * When iOS and Android broadcast in the same run they share the same on-chain account, so running
 * both can race on allowance/nonce. We pin each flow to one platform per run and rotate assignments.
 * See: https://ledgerhq.atlassian.net/browse/QAA-1411
 */

const PLATFORM_SLOTS = ["ios", "android"] as const;

export const BroadcastFlow = {
  APPROVAL: 0,
  REAPPROVAL: 1,
  BORROW: 2,
  MINA_DELEGATE: 3,
  MINA_UNDELEGATE: 4,
  MINA_REDELEGATE: 5,
  MINA_SEND: 6,
} as const;
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
 * Whether this platform owns the flow's shared account on this run.
 *
 * `E2E_BROADCAST_BOTH_MOBILE_PLATFORMS` marks the only case where ownership is contended — both
 * platforms broadcasting in the same run — which the nightlies never do, since each platform has
 * its own night (iOS Wednesday, Android Friday). Only an explicit enable_broadcast run collides.
 */
function ownsSharedAccount(flow: BroadcastFlow): boolean {
  if (process.env.E2E_BROADCAST_BOTH_MOBILE_PLATFORMS !== "true") return true;

  const assigned = PLATFORM_SLOTS[(broadcastRotationIndex() + flow) % PLATFORM_SLOTS.length];
  return currentPlatform() === assigned;
}

/**
 * Whether a flow that only makes sense when broadcasting should run in THIS platform's job:
 *  - broadcast off for this platform  → no
 *  - broadcast on, this platform only → yes (it owns the shared account alone)
 *  - broadcast on for both platforms  → only on the flow's assigned platform this run (rotated)
 */
export function shouldRunBroadcastFlow(flow: BroadcastFlow): boolean {
  if (process.env.DISABLE_TRANSACTION_BROADCAST !== "0") return false;
  return ownsSharedAccount(flow);
}

/**
 * Whether a flow that is worth running with broadcasting off should run in THIS platform's job.
 * Unlike a broadcast-only flow, it runs everywhere until a transaction actually reaches the chain,
 * at which point the same ownership rotation keeps the two platforms off each other's account.
 */
export function shouldRunSharedAccountFlow(flow: BroadcastFlow): boolean {
  if (process.env.DISABLE_TRANSACTION_BROADCAST !== "0") return true;
  return ownsSharedAccount(flow);
}
