import { useEffect } from "react";
import { NativeModules } from "react-native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { applyNavigationBarTheme, type NavigationBarBackgroundPainter } from "@shared/system-bars";

type NavigationBarColorModule = {
  setBackgroundColor: NavigationBarBackgroundPainter;
};

function getBackgroundPainter(): NavigationBarBackgroundPainter | undefined {
  const colorModule: NavigationBarColorModule | undefined = NativeModules.NavigationBarColorModule;
  if (!colorModule) return undefined;
  return argbColor => colorModule.setBackgroundColor(argbColor);
}

export default function NavBarColorHandler() {
  const { theme, colorScheme } = useTheme();
  const backgroundColor = theme.colors.bg.canvas;
  const isDark = colorScheme === "dark";
  useEffect(() => {
    applyNavigationBarTheme({ isDark, backgroundColor, paintBackground: getBackgroundPainter() });
  }, [isDark, backgroundColor]);
  return null;
}
