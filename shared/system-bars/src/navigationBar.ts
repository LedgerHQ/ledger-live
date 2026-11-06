import { Platform } from "react-native";
import { NavigationBar } from "expo-navigation-bar";

export type NavigationBarTheme = {
  isDark: boolean;
};

/**
 * Picks navigation bar button colors that stay readable on the current theme.
 * Does nothing on iOS, which has no navigation bar.
 * The style names the button color: "light" = light buttons, "dark" = dark buttons.
 */
export function applyNavigationBarTheme({ isDark }: NavigationBarTheme): void {
  if (Platform.OS !== "android") return;

  NavigationBar.setStyle(isDark ? "light" : "dark");
}
