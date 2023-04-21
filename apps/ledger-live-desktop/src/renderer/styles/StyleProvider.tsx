import "@ledgerhq/react-ui/assets/fonts";
import React, { useMemo } from "react";
import { ThemeProvider, DefaultTheme } from "styled-components";
import defaultTheme from "./theme";
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

const StyleProvider = ({ children, selectedPalette }: Props) => {
  // V2 palettes are not typed in TS so we need to explicity type them as any
  // eslint-disable-next-line
  const palettesAny: any = palettes;
  const v3SelectedPalettes = selectedPalette === "light" ? "light" : "dark";
  // @ts-expect-error This is a hack to get the v2 palette in the v3 theme
  const theme: DefaultTheme = useMemo(
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
export const withV2StyleProvider = <T,>(Component: React.ComponentType<T>) => {
  const WrappedComponent = (props: T & { children?: React.ReactNode }) => {
    const selectedPalette = (useSelector(themeSelector) || "light") as "light" | "dark";
    return (
      <StyleProvider selectedPalette={selectedPalette}>
        <Component {...props} />
      </StyleProvider>
    );
  };
  return WrappedComponent;
};
export default StyleProvider;
