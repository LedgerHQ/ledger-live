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

/**
 * @deprecated `@shared/env` is being sunset with `@ledgerhq/live-env` — see
 * https://github.com/LedgerHQ/ledger-live/blob/develop/shared/env/MIGRATION.md
 */
export type EnvName = keyof typeof allDefinitions;
type InferDef<K extends EnvName> = NonNullable<ReturnType<(typeof allDefinitions)[K]["parser"]>>;

/**
 * @deprecated `@shared/env` is being sunset with `@ledgerhq/live-env`. Replace this read with
 * a feature flag, an inline constant, `process.env` at the point of use, or a value the caller
 * passes in — see https://github.com/LedgerHQ/ledger-live/blob/develop/shared/env/MIGRATION.md
 */
export function getEnv<K extends EnvName>(name: K): InferDef<K> {
  return _getEnv(name) as InferDef<K>;
}

/**
 * @deprecated `@shared/env` is being sunset with `@ledgerhq/live-env`. A value that has to
 * change at runtime belongs in a feature flag or in the app's own state, not in a global
 * mutable singleton — see
 * https://github.com/LedgerHQ/ledger-live/blob/develop/shared/env/MIGRATION.md
 */
export function setEnv<K extends EnvName>(name: K, value: InferDef<K>): void {
  _setEnv(name, value);
}

/**
 * @deprecated `@shared/env` is being sunset with `@ledgerhq/live-env`. Read and parse the raw
 * value where you use it instead — see
 * https://github.com/LedgerHQ/ledger-live/blob/develop/shared/env/MIGRATION.md
 */
export function setEnvUnsafe(name: string, raw: unknown): boolean {
  return _setEnvUnsafe(name, raw);
}

/**
 * @deprecated `@shared/env` is being sunset with `@ledgerhq/live-env` — see
 * https://github.com/LedgerHQ/ledger-live/blob/develop/shared/env/MIGRATION.md
 */
export type EnvValue<K extends EnvName> = InferDef<K>;

export { changes } from "@ledgerhq/live-env";

/**
 * @deprecated `@shared/env` is being sunset with `@ledgerhq/live-env` — see
 * https://github.com/LedgerHQ/ledger-live/blob/develop/shared/env/MIGRATION.md
 */
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

/**
 * @deprecated `@shared/env` is being sunset with `@ledgerhq/live-env` — see
 * https://github.com/LedgerHQ/ledger-live/blob/develop/shared/env/MIGRATION.md
 */
export function getAllEnvs(): { [K in EnvName]: InferDef<K> } {
  return _getAllEnvs() as unknown as { [K in EnvName]: InferDef<K> };
}
