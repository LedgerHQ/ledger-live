import { getEnabledFunction } from "../registry";

export function isEnabled(): boolean {
  return getEnabledFunction()?.() ?? false;
}
