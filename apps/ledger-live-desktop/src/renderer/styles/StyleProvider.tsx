import "@ledgerhq/react-ui/assets/fonts";
import React, { useMemo } from "react";
import { ThemeProvider, StyledComponent } from "styled-components";
import defaultTheme, { Theme } from "./theme";
import palettes from "./palettes";
import { GlobalStyle } from "./global";
import {
  defaultTheme as V3dDfaultTheme,
  palettes as V3Palettes,
} from "@ledgerhq/react-ui/styles/index";
import { useSelector } from "react-redux";
import { themeSelector } from "../actions/general";
type Props = {
  children: React.ReactNode;
  selectedPalette: "light" | "dark";
};
export type ThemedComponent<T> = StyledComponent<T, Theme, any>;
const StyleProvider = ({ children, selectedPalette }: Props) => {
  // V2 palettes are not typed in TS so we need to explicity type them as any
  const palettesAny: any = palettes;
  const v3SelectedPalettes = selectedPalette === "light" ? "light" : "dark";
  const theme: Theme = useMemo(
    () => ({
      ...V3dDfaultTheme,
      ...defaultTheme,
      colors: {
        ...V3Palettes[v3SelectedPalettes],
        ...defaultTheme.colors,
        palette: {
          ...V3Palettes[v3SelectedPalettes],
          ...palettesAny[v3SelectedPalettes],
        },
      },
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
export const withV2StyleProvider = (Component: React.ComponentType) => {
  const WrappedComponent = props => {
    const selectedPalette = useSelector(themeSelector) || "light";
    return (
      <StyleProvider selectedPalette={selectedPalette}>
        <Component {...props} />
      </StyleProvider>
    );
  };
  return WrappedComponent;
};
export default StyleProvider;
