import "@ledgerhq/react-ui/assets/fonts";
import React, { useContext, useMemo } from "react";
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
import { StyleProviderVersionContext } from "./StyleProviderVersionContext";
type Props = {
  children: React.ReactNode;
  selectedPalette: "light" | "dark";
};

const StyleProviderV2 = ({ children, selectedPalette }: Props) => {
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

  /**
   * Because we have 2 versions of the design system cohabitating, v2 and v3,
   * some screens are wrapped in style providers of v2/v3 to ensure that their
   * content renders properly, and some more atomic components also are wrapped
   * in style providers of v2/v3. In case a "v2 wrapped" screen renders a
   * "v2 wrapped", component, their is a redundancy as several ThemeProvider
   * will be mounted, while only one was necessary, which can have an expensive
   * rendering cost.
   * This trick avoids such redundancy.
   */
  const styleProviderVersionFromContext = useContext(StyleProviderVersionContext);
  if (styleProviderVersionFromContext === "v2") return children;

  return (
    <StyleProviderVersionContext.Provider value="v2">
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </StyleProviderVersionContext.Provider>
  );
};
export const withV2StyleProvider = <T,>(Component: React.ComponentType<T>) => {
  const WrappedComponent = (props: T & { children?: React.ReactNode }) => {
    const selectedPalette = (useSelector(themeSelector) || "light") as "light" | "dark";
    return (
      <StyleProviderV2 selectedPalette={selectedPalette}>
        <Component {...props} />
      </StyleProviderV2>
    );
  };
  return WrappedComponent;
};
export default StyleProviderV2;
