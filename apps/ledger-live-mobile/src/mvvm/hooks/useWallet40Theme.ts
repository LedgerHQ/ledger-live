import { useMemo } from "react";
import { useTheme } from "styled-components/native";
import { useWalletFeaturesConfig, WalletPlatform } from "@ledgerhq/live-common/featureFlags/index";

export interface Wallet40ThemeResult {
  readonly isDarkMode: boolean;
  readonly isWallet40Enabled: boolean;
  readonly isWallet40DarkMode: boolean;
  readonly backgroundColor: string;
}

export interface Wallet40ThemeInput {
  readonly theme: string;
  readonly isWallet40Enabled: boolean;
}

/**
 * Pure function containing the theme logic.
 * Exported for testing purposes.
 */
export const computeWallet40Theme = (input: Wallet40ThemeInput): Wallet40ThemeResult => {
  const isDarkMode = input.theme === "dark";
  const isWallet40DarkMode = input.isWallet40Enabled && isDarkMode;
  const backgroundColor = isWallet40DarkMode ? "#000000" : "background.main";

  return {
    isDarkMode,
    isWallet40Enabled: input.isWallet40Enabled,
    isWallet40DarkMode,
    backgroundColor,
  };
};

/**
 * Hook providing theme-related values for Wallet 4.0.
 * Centralizes the logic for background colors and theme detection.
 *
 * @param platform - The platform to get the feature flag for ("desktop" or "mobile")
 * @returns Theme-related values for Wallet 4.0
 */
export const useWallet40Theme = (platform: WalletPlatform): Wallet40ThemeResult => {
  const { theme } = useTheme();
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig(platform);

  return useMemo(
    () => computeWallet40Theme({ theme, isWallet40Enabled }),
    [theme, isWallet40Enabled],
  );
};
