import path from "node:path";
import type { TestInfo } from "@playwright/test";
import {
  acquireExclusiveLock,
  EXCLUSIVE_LOCK_ACQUIRE_TIMEOUT_MS,
  EXCLUSIVE_LOCK_NESTED_DRAIN_MS,
  lockKeys,
  tryAcquireExclusiveLock,
  type AbandonableLease,
  type Lease,
  type LockTarget,
  type SharedResource,
} from "@ledgerhq/live-e2e-shared/exclusiveLock";
import { isExclusiveLockDeferralPass } from "@ledgerhq/live-e2e-shared/exclusiveLock/deferralPasses";
import type { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { resolveCardSessionBootstrap } from "@ledgerhq/baanx-test-client";
import { EXCLUSIVE_LOCK_DEFERRED_REASON } from "tests/utils/lockDeferrals";
import { isPaytabTest } from "tests/utils/testInfoUtils";

export const EXCLUSIVE_LOCK_FIXTURE_TIMEOUT =
  EXCLUSIVE_LOCK_ACQUIRE_TIMEOUT_MS + EXCLUSIVE_LOCK_NESTED_DRAIN_MS + 2 * 60_000;

const EXCLUSIVE_LOCK_ENV_PREFIX = "E2E_EXCLUSIVE_LOCK_";

/** `env` without the exclusive lock settings, R2 credentials included, for the app under test. */
export const withoutExclusiveLockEnv = (env: Record<string, string>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(env).filter(([name]) => !name.startsWith(EXCLUSIVE_LOCK_ENV_PREFIX)),
  );

export type LockDeclaration = {
  /** Accounts the app broadcasts from in the test, locked unless app broadcast is disabled. */
  readonly broadcastAccounts?: readonly Account[];
  /** Accounts the test broadcasts from with the CLI, e.g. token approvals, locked on every run. */
  readonly cliBroadcastAccounts?: readonly Account[];
  /** Shared state the test changes even with broadcast disabled, e.g. the Pay card it freezes. */
  readonly sharedResources?: readonly SharedResource[];
};

/** The test's `env` fixture, which overrides the runner's environment for the app. */
type TestEnv = Readonly<Record<string, string>> | undefined;

const isAppBroadcastEnabled = (env: TestEnv) =>
  (env?.DISABLE_TRANSACTION_BROADCAST ?? process.env.DISABLE_TRANSACTION_BROADCAST ?? "1") === "0";

const lockedBroadcastAccounts = ({ broadcastAccounts = [] }: LockDeclaration, env: TestEnv) =>
  isAppBroadcastEnabled(env) ? broadcastAccounts : [];

const targetsToLock = (declaration: LockDeclaration, env: TestEnv): LockTarget[] => [
  ...lockedBroadcastAccounts(declaration, env),
  ...(declaration.cliBroadcastAccounts ?? []),
  ...(declaration.sharedResources ?? []),
];

/**
 * Locks for tests that broadcast from accounts or change shared state. Give `names` to the `lock`
 * detail of their `test.describe` or `test`, so Playwright never runs two of them on the same
 * target at once in this run, and `fixtures` to `test.use`, so the exclusive lock fixture keeps
 * other CI machines off them. The fixture takes the whole declaration: Playwright reads an array
 * whose second item is an object, e.g. two accounts, as a `[value, options]` fixture. `names` only
 * see the runner's environment, while the fixture locks on the broadcast setting the app gets.
 */
export function exclusiveLockFor(declaration: LockDeclaration) {
  return {
    names: lockKeys(targetsToLock(declaration, undefined)),
    fixtures: { lockDeclaration: declaration },
  };
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
  declaration: LockDeclaration,
  env: TestEnv,
  testInfo: TestInfo,
): Promise<Lease | undefined> {
  const lease = await acquireDeclaredTargets(declaration, env, testInfo);
  if (!lease || lockedBroadcastAccounts(declaration, env).length > 0) return lease;
  return { release: () => lease.abandon() };
}

async function acquireDeclaredTargets(
  declaration: LockDeclaration,
  env: TestEnv,
  testInfo: TestInfo,
): Promise<AbandonableLease | undefined> {
  const targets = targetsToLock(declaration, env);
  if (targets.length === 0) return undefined;
  const label = `desktop ${path.basename(testInfo.file)} › ${testInfo.title}`;
  if (testInfo.retry === 0 && isExclusiveLockDeferralPass()) {
    const lease = await tryAcquireExclusiveLock(targets, label, { allowNested: true });
    if (lease) {
      try {
        await resolvePaytabCardSession(testInfo);
      } catch (error) {
        await lease.abandon();
        throw error;
      }
      return lease;
    }
    console.warn(`${EXCLUSIVE_LOCK_DEFERRED_REASON} (${label})`);
    testInfo.skip(true, EXCLUSIVE_LOCK_DEFERRED_REASON);
  }
  await resolvePaytabCardSession(testInfo);
  return acquireExclusiveLock(targets, label, { allowNested: true });
}
