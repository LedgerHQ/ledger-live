import "@ledgerhq/react-ui/assets/fonts";
import React, { useMemo } from "react";
import { ThemeProvider, useTheme } from "styled-components";
import type { StyledComponent } from "styled-components";
import defaultTheme from "./theme";
import palettes from "./palettes";
import type { Theme } from "./theme";

import { GlobalStyle } from "@ledgerhq/react-ui/styles";

import { defaultTheme as V3dDfaultTheme, palettes as V3Palettes } from "@ledgerhq/react-ui/styles";

type Props = {
  children: React.ReactNode;
  selectedPalette: "light" | "dark";
};

export type ThemedComponent<T> = StyledComponent<T, Theme, any>;

const StyleProviderV3 = ({ children, selectedPalette }: Props) => {
    const palettesAny: any = palettes;
    const v3SelectedPalettes = selectedPalette === "light" ? "light" : "dark";
    const theme: Theme = useMemo(
      () => ({
        ...defaultTheme,
        ...V3dDfaultTheme,
        colors: {
          ...defaultTheme.colors,
          ...V3Palettes[v3SelectedPalettes],
          palette: { ...palettesAny[v3SelectedPalettes], ...V3Palettes[v3SelectedPalettes] },
        },
        theme: v3SelectedPalettes,
      }),
      [palettesAny, v3SelectedPalettes],
  );

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
};

export const withV3StyleProvider = (WrappedComponent: React.ComponentType) => ({ props }) => {
  const theme = useTheme();

  return (
    <StyleProviderV3 selectedPalette={theme.colors.type}>
      <WrappedComponent {...props} />
    </StyleProviderV3>
  );
};

export default StyleProviderV3;