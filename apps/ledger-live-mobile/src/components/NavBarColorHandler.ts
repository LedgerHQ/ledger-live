import { useEffect } from "react";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { applyNavigationBarTheme } from "@shared/system-bars";

export default function NavBarColorHandler() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  useEffect(() => {
    applyNavigationBarTheme({ isDark });
  }, [isDark]);
  return null;
}
