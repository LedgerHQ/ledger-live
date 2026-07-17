export type EnvDef<T> = { def: T; parser: (v: unknown) => T | undefined; desc: string };
export type EnvDefs = Record<string, EnvDef<any>>;

type State = {
  definitions: EnvDefs;
  env: Record<string, unknown>;
  defaults: Record<string, unknown>;
};

export type EnvChange = { name: string; value: unknown; oldValue: unknown };
type Listener = (change: EnvChange) => void;

type LedgerGlobal = typeof globalThis & {
  __ledgerLiveEnvState?: State;
  __ledgerLiveEnvListeners?: Set<Listener>;
};
const g = globalThis as LedgerGlobal;

function getListeners(): Set<Listener> {
  if (!g.__ledgerLiveEnvListeners) {
    g.__ledgerLiveEnvListeners = new Set();
  }
  return g.__ledgerLiveEnvListeners;
}

export const changes = {
  subscribe(fn: Listener): { unsubscribe(): void } {
    getListeners().add(fn);
    return { unsubscribe: () => void getListeners().delete(fn) };
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

export function injectDefinitions(defs: EnvDefs): void {
  // Idempotent: Jest reloads modules per test file but globalThis persists, so skip if already set.
  if (g.__ledgerLiveEnvState !== undefined) return;
  const defaults = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.def]));
  g.__ledgerLiveEnvState = { definitions: defs, env: { ...defaults }, defaults };
}

export function configured(): State {
  if (g.__ledgerLiveEnvState === undefined)
    throw new Error("[live-env] Call injectDefinitions() before using live-env");
  return g.__ledgerLiveEnvState;
}
