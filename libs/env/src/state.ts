export type EnvDef<T> = { def: T; parser: (v: unknown) => T | undefined; desc: string };
export type EnvDefs = Record<string, EnvDef<any>>;

type State = {
  definitions: EnvDefs;
  env: Record<string, unknown>;
  defaults: Record<string, unknown>;
};

let s: State | null = null;

export type EnvChange = { name: string; value: unknown; oldValue: unknown };
type Listener = (change: EnvChange) => void;

const _listeners = new Set<Listener>();

export const changes = {
  subscribe(fn: Listener): { unsubscribe(): void } {
    _listeners.add(fn);
    return { unsubscribe: () => void _listeners.delete(fn) };
  },
};

export function notifyChange(change: EnvChange): void {
  _listeners.forEach(fn => fn(change));
}

export function injectDefinitions(defs: EnvDefs): void {
  if (s !== null) throw new Error("[live-env] injectDefinitions() called twice");
  const defaults = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.def]));
  s = { definitions: defs, env: { ...defaults }, defaults };
}

export function configured(): State {
  if (s === null) throw new Error("[live-env] Call injectDefinitions() before using live-env");
  return s;
}
