import "@ledgerhq/react-ui/assets/fonts";
import React, { useMemo } from "react";
import { StyledComponent, ThemeProvider, useTheme } from "styled-components";
import defaultTheme, { Theme } from "./theme";
import palettes from "./palettes";

import {
  GlobalStyle,
  defaultTheme as V3dDfaultTheme,
  palettes as V3Palettes,
} from "@ledgerhq/react-ui/styles/index";

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

export const withV3StyleProvider = (Component: React.ComponentType) => {
  const WrappedComponent = props => {
    const theme = useTheme();

    return (
      <StyleProviderV3 selectedPalette={theme.colors.type}>
        <Component {...props} />
      </StyleProviderV3>
    );
  };
  return WrappedComponent;
};

export default StyleProviderV3;
