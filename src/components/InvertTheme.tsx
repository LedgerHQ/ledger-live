import React, { useMemo } from "react";
import { ThemeProvider, useTheme } from "styled-components/native";
import { defaultTheme, palettes } from "@ledgerhq/native-ui/styles";

export default function InvertTheme({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const { theme } = useTheme();
  const revertTheme = theme === "light" ? "dark" : "light";
  const newTheme = useMemo(
    () => ({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, palette: palettes[revertTheme] },
      theme: revertTheme,
    }),
    [revertTheme],
  );

  return <ThemeProvider theme={newTheme}>{children}</ThemeProvider>;
}
