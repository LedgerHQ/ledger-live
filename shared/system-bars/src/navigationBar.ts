import { Platform } from "react-native";
import * as ExpoNavigationBar from "expo-navigation-bar";

export type NavigationBarTheme = {
  backgroundColor: string;
  isDark: boolean;
};

/**
 * Paints the Android navigation bar and picks button colors that stay readable on it.
 * Does nothing on iOS, which has no navigation bar.
 */
export async function applyNavigationBarTheme({
  backgroundColor,
  isDark,
}: NavigationBarTheme): Promise<void> {
  if (Platform.OS !== "android") return;

  await ExpoNavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
  await ExpoNavigationBar.setBackgroundColorAsync(backgroundColor);
}
