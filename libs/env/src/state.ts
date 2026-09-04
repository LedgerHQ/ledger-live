/**
 * @deprecated `@ledgerhq/live-env` is being sunset — see MIGRATION.md.
 */
export type EnvDef<T> = { def: T; parser: (v: unknown) => T | undefined; desc: string };
/**
 * @deprecated `@ledgerhq/live-env` is being sunset — see MIGRATION.md.
 */
export type EnvDefs = Record<string, EnvDef<unknown>>;

type State = {
  definitions: EnvDefs;
  env: Record<string, unknown>;
  defaults: Record<string, unknown>;
};

/**
 * @deprecated `@ledgerhq/live-env` is being sunset — see MIGRATION.md.
 */
export type EnvChange = { name: string; value: unknown; oldValue: unknown };
type Listener = (change: EnvChange) => void;

type LedgerGlobal = typeof globalThis & {
  __ledgerLiveEnvState?: State;
  __ledgerLiveEnvListeners?: Set<Listener>;
};
const g = globalThis as LedgerGlobal;

function getListeners(): Set<Listener> {
  g.__ledgerLiveEnvListeners ??= new Set();
  return g.__ledgerLiveEnvListeners;
}

/**
 * @deprecated `@ledgerhq/live-env` is being sunset. Subscribe to the app's own state or to a
 * feature flag instead — see MIGRATION.md.
 */
export const changes = {
  subscribe(fn: Listener): { unsubscribe(): void } {
    getListeners().add(fn);
    return {
      unsubscribe: () => {
        getListeners().delete(fn);
      },
    };
  },
};

export function notifyChange(change: EnvChange): void {
  getListeners().forEach(fn => {
    try {
      fn(change);
    } catch {
      // Prevent one listener from blocking others
    }
  });
}

/**
 * @deprecated `@ledgerhq/live-env` is being sunset. Do not register new definitions —
 * see MIGRATION.md.
 */
export function injectDefinitions(defs: EnvDefs): void {
  // Idempotent: Jest reloads modules per test file but globalThis persists, so skip if already set.
  if (g.__ledgerLiveEnvState !== undefined) return;
  const defaults = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.def]));
  g.__ledgerLiveEnvState = { definitions: defs, env: { ...defaults }, defaults };
}

export function configured(name?: string): State {
  if (g.__ledgerLiveEnvState === undefined)
    throw new Error("[live-env] Call injectDefinitions() before using live-env");
  if (
    name !== undefined &&
    !Object.prototype.hasOwnProperty.call(g.__ledgerLiveEnvState.definitions, name)
  )
    throw new Error(
      `[live-env] "${name}" is not in injected definitions. Add it to your injectDefinitions() call.`,
    );
  return g.__ledgerLiveEnvState;
}
