import { Subject } from "rxjs";

export type EnvDef<T> = { def: T; parser: (v: unknown) => T | undefined; desc: string };
export type EnvDefs = Record<string, EnvDef<any>>;

type State = {
  definitions: EnvDefs;
  env: Record<string, unknown>;
  defaults: Record<string, unknown>;
};

let s: State | null = null;

export const changes: Subject<{ name: string; value: unknown; oldValue: unknown }> = new Subject();

export function injectDefinitions(defs: EnvDefs): void {
  if (s !== null) throw new Error("[live-env] injectDefinitions() called twice");
  const defaults = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.def]));
  s = { definitions: defs, env: { ...defaults }, defaults };
}

export function configured(): State {
  if (s === null) throw new Error("[live-env] Call injectDefinitions() before using live-env");
  return s;
}
