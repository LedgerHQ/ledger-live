import { useMemo } from "react";
import { useTheme } from "styled-components/native";

export interface Wallet40ThemeResult {
  readonly isDarkMode: boolean;
  readonly backgroundColor: string;
}

export interface Wallet40ThemeInput {
  readonly theme: string;
}

/**
 * Pure function containing the theme logic.
 * Exported for testing purposes.
 */
export const computeWallet40Theme = (input: Wallet40ThemeInput): Wallet40ThemeResult => {
  const isDarkMode = input.theme === "dark";
  const backgroundColor = isDarkMode ? "#000000" : "background.main";

  return {
    isDarkMode,
    backgroundColor,
  };
};

/**
 * Hook providing theme-related values for Wallet 4.0.
 * Centralizes the background-color logic. Wallet 4.0 is always enabled,
 * so the values depend only on the current light/dark palette.
 */
export const useWallet40Theme = (): Wallet40ThemeResult => {
  const { theme } = useTheme();

  return useMemo(() => computeWallet40Theme({ theme }), [theme]);
};
