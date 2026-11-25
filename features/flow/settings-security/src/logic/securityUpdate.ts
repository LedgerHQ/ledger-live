import type { SecuritySideEffects } from "../ports";
import type { SecurityUpdate } from "../types";

const EDITABLE_SECURITY_KEYS: ReadonlySet<string> = new Set<SecurityUpdate["key"]>([
  "hideBalance",
  "mevProtection",
  "autoLockTimeout",
]);

/** Tells whether a change of the Settings port belongs to the Security section. */
export function isSecurityUpdate(update: Readonly<{ key: string }>): update is SecurityUpdate {
  return EDITABLE_SECURITY_KEYS.has(update.key);
}

/** Runs the side effect of one change: exactly one call, chosen by the key. */
export function applySecurityUpdate(effects: SecuritySideEffects, update: SecurityUpdate): void {
  switch (update.key) {
    case "hideBalance":
      effects.setHideBalance(update.value);
      return;
    case "mevProtection":
      effects.setMevProtection(update.value);
      return;
    case "autoLockTimeout":
      effects.setAutoLockTimeout(update.value);
      return;
  }
}
