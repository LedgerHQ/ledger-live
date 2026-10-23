import { useEffect } from "react";
import { useTheme } from "@react-navigation/native";
import { applyNavigationBarTheme } from "@shared/system-bars";

export default function NavBarColorHandler() {
  const { dark, colors } = useTheme();
  useEffect(() => {
    applyNavigationBarTheme({ backgroundColor: colors.card, isDark: dark }).catch(console.error);
  }, [colors, dark]);
  return null;
}
