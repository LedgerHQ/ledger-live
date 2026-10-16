import path from "node:path";
import type { TestInfo } from "@playwright/test";
import {
  acquireAccountBroadcastLock,
  BROADCAST_LOCK_ACQUIRE_TIMEOUT_MS,
  BROADCAST_LOCK_NESTED_DRAIN_MS,
  lockKeys,
  tryAcquireAccountBroadcastLock,
  type AbandonableLease,
  type Lease,
  type LockTarget,
  type SharedResource,
} from "@ledgerhq/live-e2e-shared/broadcastLock";
import { isBroadcastLockDeferralPass } from "@ledgerhq/live-e2e-shared/broadcastLock/deferralPasses";
import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { resolveCardSessionBootstrap } from "@ledgerhq/baanx-test-client";
import { BROADCAST_LOCK_DEFERRED_REASON } from "tests/utils/broadcastDeferrals";
import { isPaytabTest } from "tests/utils/testInfoUtils";

export const BROADCAST_LOCK_FIXTURE_TIMEOUT =
  BROADCAST_LOCK_ACQUIRE_TIMEOUT_MS + BROADCAST_LOCK_NESTED_DRAIN_MS + 2 * 60_000;

const BROADCAST_LOCK_ENV_PREFIX = "E2E_BROADCAST_LOCK_";

/** `env` without the broadcast lock settings, R2 credentials included, for the app under test. */
export const withoutBroadcastLockEnv = (env: Record<string, string>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(env).filter(([name]) => !name.startsWith(BROADCAST_LOCK_ENV_PREFIX)),
  );

export type BroadcastLockDeclaration = {
  /** Accounts the app broadcasts from in the test, locked unless app broadcast is disabled. */
  readonly broadcastAccounts?: readonly Account[];
  /** Accounts the test broadcasts from with the CLI, e.g. token approvals, locked on every run. */
  readonly cliBroadcastAccounts?: readonly Account[];
  /** Shared state the test changes even with broadcast disabled, e.g. the Pay card it freezes. */
  readonly sharedResources?: readonly SharedResource[];
};

const isAppBroadcastEnabled = () => process.env.DISABLE_TRANSACTION_BROADCAST === "0";

const lockedBroadcastAccounts = ({ broadcastAccounts = [] }: BroadcastLockDeclaration) =>
  isAppBroadcastEnabled() ? broadcastAccounts : [];

const targetsToLock = (declaration: BroadcastLockDeclaration): LockTarget[] => [
  ...lockedBroadcastAccounts(declaration),
  ...(declaration.cliBroadcastAccounts ?? []),
  ...(declaration.sharedResources ?? []),
];

/**
 * Locks for tests that broadcast from accounts or change shared state. Give `names` to the `lock`
 * detail of their `test.describe` or `test`, so Playwright never runs two of them on the same
 * target at once in this run, and `fixtures` to `test.use`, so the broadcast lock fixture keeps
 * other CI machines off them. The fixture takes the whole declaration: Playwright reads an array
 * whose second item is an object, e.g. two accounts, as a `[value, options]` fixture.
 */
export function broadcastLockFor(declaration: BroadcastLockDeclaration) {
  return {
    names: lockKeys(targetsToLock(declaration)),
    fixtures: { broadcastLockDeclaration: declaration },
  };
}

/**
 * Runs `fn`, which may wait for a broadcast lock no fixture of the test holds, on the lock
 * fixture's budget, then gives the rest of the test its own timeout back.
 */
export async function withBroadcastLockBudget<T>(
  testInfo: TestInfo,
  fn: () => Promise<T>,
): Promise<T> {
  const { timeout } = testInfo;
  if (timeout === 0) return fn();
  const startedAt = Date.now();
  testInfo.setTimeout(timeout + BROADCAST_LOCK_FIXTURE_TIMEOUT);
  try {
    return await fn();
  } finally {
    testInfo.setTimeout(timeout + Date.now() - startedAt);
  }
}

/**
 * A Pay tab test gets its card session before waiting for its locks, or right after trying them,
 * so a Baanx failure never holds them and a test deferred for busy locks does not log in.
 */
const resolvePaytabCardSession = async (testInfo: TestInfo) => {
  if (isPaytabTest(testInfo)) await resolveCardSessionBootstrap();
};

/**
 * Locks what the test declares before its app starts, across every CI machine. On a deferring pass
 * a first attempt that finds them busy is skipped so a later pass runs it; otherwise it waits.
 * CLI broadcasts wait for their confirmation, so only an app broadcast leaves a settle window.
 */
export async function lockDeclaredTargets(
  declaration: BroadcastLockDeclaration,
  testInfo: TestInfo,
): Promise<Lease | undefined> {
  const lease = await acquireDeclaredTargets(declaration, testInfo);
  if (!lease || lockedBroadcastAccounts(declaration).length > 0) return lease;
  return { release: () => lease.abandon() };
}

async function acquireDeclaredTargets(
  declaration: BroadcastLockDeclaration,
  testInfo: TestInfo,
): Promise<AbandonableLease | undefined> {
  const targets = targetsToLock(declaration);
  if (targets.length === 0) return undefined;
  const label = `desktop ${path.basename(testInfo.file)} › ${testInfo.title}`;
  if (testInfo.retry === 0 && isBroadcastLockDeferralPass()) {
    const lease = await tryAcquireAccountBroadcastLock(targets, label, { allowNested: true });
    if (lease) {
      try {
        await resolvePaytabCardSession(testInfo);
      } catch (error) {
        await lease.abandon();
        throw error;
      }
      return lease;
    }
    console.warn(`${BROADCAST_LOCK_DEFERRED_REASON} (${label})`);
    testInfo.skip(true, BROADCAST_LOCK_DEFERRED_REASON);
  }
  await resolvePaytabCardSession(testInfo);
  return acquireAccountBroadcastLock(targets, label, { allowNested: true });
}
