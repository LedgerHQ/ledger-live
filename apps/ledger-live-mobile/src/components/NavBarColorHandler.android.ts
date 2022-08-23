import { useEffect } from "react";
import { useTheme } from "@react-navigation/native";
import changeNavigationBarColor from "react-native-navigation-bar-color";

export default function NavBarColorHandler() {
  const { dark, colors } = useTheme();
  useEffect(() => {
    changeNavigationBarColor(colors.card, !dark);
  }, [colors, dark]);
  return null;
}
