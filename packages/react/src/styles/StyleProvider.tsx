import React, { useMemo } from "react";
import { ThemeProvider } from "styled-components";
import { defaultTheme, GlobalStyle } from ".";
import { ThemeNames, palettes } from "@ledgerhq/ui-shared";
import { Theme } from "./theme";

interface Props {
  children: React.ReactNode;
  selectedPalette?: ThemeNames;
  fontsPath?: string;
}

export const StyleProvider = ({
  children,
  fontsPath,
  selectedPalette = "light",
}: Props): React.ReactElement => {
  const theme: Theme = useMemo(
    () => ({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, palette: palettes[selectedPalette] },
    }),
    [selectedPalette],
  );
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle fontsPath={fontsPath} />
      {children}
    </ThemeProvider>
  );
};
