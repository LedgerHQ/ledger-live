import path from "node:path";
import type { TestInfo } from "@playwright/test";
import {
  acquireAccountBroadcastLock,
  BROADCAST_LOCK_ACQUIRE_TIMEOUT_MS,
  BROADCAST_LOCK_NESTED_DRAIN_MS,
  lockTargetKey,
  tryAcquireAccountBroadcastLock,
  type Lease,
  type LockTarget,
  type SharedResource,
} from "@ledgerhq/live-e2e-shared/broadcastLock";
import { isBroadcastLockDeferralPass } from "@ledgerhq/live-e2e-shared/broadcastLock/deferralPasses";
import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { BROADCAST_LOCK_DEFERRED_REASON } from "tests/utils/broadcastDeferrals";

export const BROADCAST_LOCK_FIXTURE_TIMEOUT =
  BROADCAST_LOCK_ACQUIRE_TIMEOUT_MS + BROADCAST_LOCK_NESTED_DRAIN_MS + 2 * 60_000;

const BROADCAST_LOCK_ENV_PREFIX = "E2E_BROADCAST_LOCK_";

/** Keeps the broadcast lock settings, R2 credentials included, out of the app under test. */
export function deleteBroadcastLockEnv(env: Record<string, unknown>): void {
  for (const name of Object.keys(env)) {
    if (name.startsWith(BROADCAST_LOCK_ENV_PREFIX)) delete env[name];
  }
}

export type BroadcastLockDeclaration = {
  /** Accounts the test broadcasts from, locked unless app broadcast is disabled. */
  readonly broadcastAccounts: readonly Account[];
  /** Shared state the test changes even with broadcast disabled, e.g. the Pay card it freezes. */
  readonly sharedResources: readonly SharedResource[];
};

const isAppBroadcastEnabled = () => process.env.DISABLE_TRANSACTION_BROADCAST === "0";

const targetsToLock = ({
  broadcastAccounts = [],
  sharedResources = [],
}: Partial<BroadcastLockDeclaration>): LockTarget[] => [
  ...(isAppBroadcastEnabled() ? broadcastAccounts : []),
  ...sharedResources,
];

/**
 * Locks for tests that broadcast from accounts or change shared state. Give `names` to the `lock`
 * detail of their `test.describe` or `test`, so Playwright never runs two of them on the same
 * target at once in this run, and `fixtures` to `test.use`, so the broadcast lock fixture keeps
 * other CI machines off them.
 */
export function broadcastLockFor(declaration: Partial<BroadcastLockDeclaration>) {
  return {
    names: [...new Set(targetsToLock(declaration).map(target => lockTargetKey(target)))],
    fixtures: {
      broadcastAccounts: declaration.broadcastAccounts ?? [],
      sharedResources: declaration.sharedResources ?? [],
    },
  };
}

/**
 * Locks what the test declares before its app starts, across every CI machine. On a deferring pass
 * a first attempt that finds them busy is skipped so a later pass runs it; otherwise it waits.
 */
export async function lockDeclaredTargets(
  declaration: BroadcastLockDeclaration,
  testInfo: TestInfo,
): Promise<Lease | undefined> {
  const targets = targetsToLock(declaration);
  if (targets.length === 0) return undefined;
  const label = `desktop ${path.basename(testInfo.file)} › ${testInfo.title}`;
  if (testInfo.retry === 0 && isBroadcastLockDeferralPass()) {
    const lease = await tryAcquireAccountBroadcastLock(targets, label, { allowNested: true });
    if (lease) return lease;
    console.warn(`${BROADCAST_LOCK_DEFERRED_REASON} (${label})`);
    testInfo.skip(true, BROADCAST_LOCK_DEFERRED_REASON);
  }
  return acquireAccountBroadcastLock(targets, label, { allowNested: true });
}
