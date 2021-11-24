import React, { useMemo } from "react";
import { ThemeProvider } from "styled-components";
import { defaultTheme, GlobalStyle, GlobalStyleProps } from ".";
import { ThemeNames, palettes } from "@ledgerhq/ui-shared";
import { Theme } from "./theme";

interface Props extends GlobalStyleProps {
  children: React.ReactNode;
  selectedPalette?: ThemeNames;
}

export const StyleProvider = ({
  children,
  fontsPath,
  fontMappings,
  selectedPalette = "light",
}: Props): React.ReactElement => {
  const theme: Theme = useMemo(
    () => ({
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        ...palettes[selectedPalette],
        palette: palettes[selectedPalette],
      },
      theme: selectedPalette,
    }),
    [selectedPalette],
  );
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle fontsPath={fontsPath} fontMappings={fontMappings} />
      {children}
    </ThemeProvider>
  );
};
