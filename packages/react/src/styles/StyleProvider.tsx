import React, { useMemo } from "react";
import { ThemeProvider } from "styled-components";
import { defaultTheme, palettes, GlobalStyle } from ".";
import type { ThemeNames } from "./palettes";
import { Theme } from "./theme";

interface Props {
  children: React.ReactNode;
  selectedPalette: ThemeNames;
}

const StyleProvider = ({ children, selectedPalette }: Props): React.ReactElement => {
  const theme: Theme = useMemo(
    () => ({
      ...defaultTheme,
      colors: { ...defaultTheme.colors, palette: palettes[selectedPalette] },
    }),
    [selectedPalette],
  );
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
};

export default StyleProvider;
