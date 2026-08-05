import {
  injectDefinitions,
  getEnv as _getEnv,
  setEnv as _setEnv,
  setEnvUnsafe as _setEnvUnsafe,
  getEnvDefault as _getEnvDefault,
  getAllEnvs as _getAllEnvs,
} from "@ledgerhq/live-env";
import { allDefinitions } from "./definitions";

injectDefinitions(allDefinitions);

export type EnvName = keyof typeof allDefinitions;
type InferDef<K extends EnvName> = NonNullable<ReturnType<(typeof allDefinitions)[K]["parser"]>>;

export function getEnv<K extends EnvName>(name: K): InferDef<K> {
  return _getEnv(name) as InferDef<K>;
}

export function setEnv<K extends EnvName>(name: K, value: InferDef<K>): void {
  _setEnv(name, value);
}

export function setEnvUnsafe(name: string, raw: unknown): boolean {
  return _setEnvUnsafe(name, raw);
}

export type EnvValue<K extends EnvName> = InferDef<K>;

export { changes } from "@ledgerhq/live-env";

export function getEnvDefault<K extends EnvName>(name: K): InferDef<K> {
  return _getEnvDefault(name) as InferDef<K>;
}

// Re-export framework utilities for consumers
export {
  intParser,
  floatParser,
  boolParser,
  stringParser,
  jsonParser,
  stringArrayParser,
  isEnvDefault,
  getEnvDesc,
  getDefinition,
  getAllEnvNames,
} from "@ledgerhq/live-env";

export function getAllEnvs(): { [K in EnvName]: InferDef<K> } {
  return _getAllEnvs() as unknown as { [K in EnvName]: InferDef<K> };
}
