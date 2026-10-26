import { useEffect } from "react";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { applyNavigationBarTheme } from "@shared/system-bars";

export default function NavBarColorHandler() {
  const { theme, colorScheme } = useTheme();
  const backgroundColor = theme.colors.bg.canvas;
  const isDark = colorScheme === "dark";
  useEffect(() => {
    applyNavigationBarTheme({ backgroundColor, isDark }).catch(console.error);
  }, [backgroundColor, isDark]);
  return null;
}
