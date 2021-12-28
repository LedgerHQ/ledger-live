import React, { useMemo } from "react";
import { ThemeProvider, useTheme } from "styled-components/native";
import { defaultTheme } from ".";
import { ThemeNames, palettes } from "@ledgerhq/ui-shared";
import { Theme } from "./theme";

interface Props {
  children: React.ReactNode;
  selectedPalette?: ThemeNames;
}

export const InvertTheme = ({ children }: Props): React.ReactElement => {
  const { theme } = useTheme();
  const revertTheme = theme === "light" ? "dark" : "light";
  const newTheme: Theme = useMemo(
    () => ({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, palette: palettes[revertTheme] },
      theme: revertTheme,
    }),
    [revertTheme],
  );

  return <ThemeProvider theme={newTheme}>{children}</ThemeProvider>;
};
