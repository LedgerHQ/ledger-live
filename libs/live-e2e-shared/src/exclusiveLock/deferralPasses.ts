/** How many passes may move a test whose exclusive lock is busy on to the next pass. */
export const LOCK_DEFERRAL_PASSES = 2;

/** "1" on the passes that may defer; the pass after them waits for busy locks instead. */
const EXCLUSIVE_LOCK_DEFER_ENV = "E2E_EXCLUSIVE_LOCK_DEFER";

type Env = Readonly<Record<string, string | undefined>>;

export const isExclusiveLockDeferralPass = (env: Env = process.env): boolean =>
  env[EXCLUSIVE_LOCK_DEFER_ENV] === "1";

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
  deferralPasses: number = LOCK_DEFERRAL_PASSES,
): Promise<number> {
  return runPassesFrom({ runPass, deferralPasses, number: 1 });
}

type RunPass<Item> = (pass: DeferralPass<Item>) => Promise<DeferralPassResult<Item>>;

type RunPassesOptions<Item> = {
  runPass: RunPass<Item>;
  deferralPasses: number;
  number: number;
  items?: readonly Item[];
};

async function runPassesFrom<Item>(options: RunPassesOptions<Item>): Promise<number> {
  const { runPass, deferralPasses, number, items } = options;
  const mayDefer = number <= deferralPasses;
  const { exitCode, deferred } = await runPass({
    number,
    mayDefer,
    items,
    env: { [EXCLUSIVE_LOCK_DEFER_ENV]: mayDefer ? "1" : "0" },
  });
  if (!mayDefer || deferred.length === 0) return exitCode;
  const laterExitCode = await runPassesFrom({
    runPass,
    deferralPasses,
    number: number + 1,
    items: deferred,
  });
  return exitCode || laterExitCode;
}
