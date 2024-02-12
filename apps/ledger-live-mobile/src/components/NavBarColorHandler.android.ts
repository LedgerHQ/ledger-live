import { useEffect } from "react";
import { useTheme } from "@react-navigation/native";
import changeNavigationBarColor from "react-native-navigation-bar-color";

export default function NavBarColorHandler() {
  const { dark, colors } = useTheme();
  useEffect(() => {
    try {
      changeNavigationBarColor(colors.card, !dark, true);
    } catch (e) {
      console.error(e);
    }
  }, [colors, dark]);
  return null;
}
