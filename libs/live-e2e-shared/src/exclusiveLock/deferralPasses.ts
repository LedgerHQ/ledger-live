/** How many passes may move a test whose exclusive lock is busy on to the next pass. */
const LOCK_DEFERRAL_PASSES_ENV = "E2E_EXCLUSIVE_LOCK_DEFERRAL_PASSES";

/** "1" on the passes that may defer; the pass after them waits for busy locks instead. */
const EXCLUSIVE_LOCK_DEFER_ENV = "E2E_EXCLUSIVE_LOCK_DEFER";

const DEFAULT_DEFERRAL_PASSES = 2;

type Env = Readonly<Record<string, string | undefined>>;

export const isExclusiveLockDeferralPass = (env: Env = process.env): boolean =>
  env[EXCLUSIVE_LOCK_DEFER_ENV] === "1";

export function lockDeferralPasses(env: Env = process.env): number {
  const configured = env[LOCK_DEFERRAL_PASSES_ENV]?.trim();
  if (!configured) return DEFAULT_DEFERRAL_PASSES;
  const passes = Number(configured);
  if (!Number.isInteger(passes) || passes < 0) {
    throw new Error(
      `${LOCK_DEFERRAL_PASSES_ENV} must be a whole number of passes, 0 or more, not "${configured}"`,
    );
  }
  return passes;
}

export type DeferralPass<Item> = {
  readonly number: number;
  readonly mayDefer: boolean;
  /** What the previous pass deferred; undefined on the first pass, which runs everything. */
  readonly items: readonly Item[] | undefined;
  /** To add to the environment of the tests the pass runs. */
  readonly env: Readonly<Record<string, string>>;
};

export type DeferralPassResult<Item> = {
  readonly exitCode: number;
  readonly deferred: readonly Item[];
};

/**
 * Runs everything once, then runs again what each pass deferred because its exclusive lock was
 * busy, until nothing is deferred. After `deferralPasses` deferring passes, the last one waits for
 * busy locks instead. Resolves to the first non-zero exit code of the passes.
 */
export function runWithDeferralPasses<Item>(
  runPass: RunPass<Item>,
  deferralPasses: number = lockDeferralPasses(),
): Promise<number> {
  return runPassesFrom(runPass, deferralPasses, 1, undefined);
}

type RunPass<Item> = (pass: DeferralPass<Item>) => Promise<DeferralPassResult<Item>>;

async function runPassesFrom<Item>(
  runPass: RunPass<Item>,
  deferralPasses: number,
  number: number,
  items: readonly Item[] | undefined,
): Promise<number> {
  const mayDefer = number <= deferralPasses;
  const { exitCode, deferred } = await runPass({
    number,
    mayDefer,
    items,
    env: { [EXCLUSIVE_LOCK_DEFER_ENV]: mayDefer ? "1" : "0" },
  });
  if (!mayDefer || deferred.length === 0) return exitCode;
  const laterExitCode = await runPassesFrom(runPass, deferralPasses, number + 1, deferred);
  return exitCode || laterExitCode;
}
