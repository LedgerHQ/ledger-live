import { getEnabledFn } from "../registry";

export function isEnabled(): boolean {
  return getEnabledFn()?.() ?? false;
}
