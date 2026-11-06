import { Platform, processColor } from "react-native";
import { NavigationBar } from "expo-navigation-bar";

export type NavigationBarBackgroundPainter = (argbColor: number) => void;

export type NavigationBarTheme = {
  isDark: boolean;
  backgroundColor: string;
  paintBackground?: NavigationBarBackgroundPainter;
};

/** Android only: style "light" = light buttons; the bar is painted only if `paintBackground` is given. */
export function applyNavigationBarTheme({
  isDark,
  backgroundColor,
  paintBackground,
}: NavigationBarTheme): void {
  if (Platform.OS !== "android") return;

  NavigationBar.setStyle(isDark ? "light" : "dark");
  if (paintBackground) paintNavigationBar(backgroundColor, paintBackground);
}

function paintNavigationBar(
  backgroundColor: string,
  paintBackground: NavigationBarBackgroundPainter,
): void {
  const argbColor = processColor(backgroundColor);
  if (typeof argbColor !== "number") {
    console.warn(`Navigation bar not painted: invalid color "${backgroundColor}"`);
    return;
  }

  paintBackground(argbColor);
}
