import type { SettingsPort } from "@features/flow-settings";
import { useGeneralSettingsAdapter } from "./sections/general";

/**
 * Builds the settings port of Ledger Wallet Desktop from the legacy settings store. Each section
 * has its own adapter that reads its values and runs the side effects the legacy Settings screens
 * run today.
 */
export function useDesktopSettingsPort(): SettingsPort {
  return useGeneralSettingsAdapter();
}
