import { useEffect } from "react";
import { useTheme } from "styled-components/native";
import changeNavigationBarColor from "react-native-navigation-bar-color";

export default function NavBarColorHandler() {
  const { palette, colors } = useTheme();
  useEffect(() => {
    try {
      changeNavigationBarColor(colors.background.drawer, palette !== "dark", true);
    } catch (e) {
      console.error(e);
    }
  }, [colors, palette]);
  return null;
}
