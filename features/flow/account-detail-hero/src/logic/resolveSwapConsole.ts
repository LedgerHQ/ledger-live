import type { QuickActionsPlatform } from "@features/platform-quick-actions";
import type { AccountHeroAvailability } from "../hero/types";

export function resolveSwapConsole(
  platform: QuickActionsPlatform,
  { isCurrencySupported, isSwapAvailable }: AccountHeroAvailability,
): boolean {
  return platform === "desktop" && isCurrencySupported && isSwapAvailable;
}
