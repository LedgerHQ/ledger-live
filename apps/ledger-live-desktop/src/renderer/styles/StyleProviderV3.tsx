import "@ledgerhq/react-ui/assets/fonts";
import React, { useMemo } from "react";
import { DefaultTheme, ThemeProvider, useTheme } from "styled-components";
import defaultTheme from "./theme";
import v2Palettes from "./palettes";
import {
  GlobalStyle,
  defaultTheme as v3DefaultTheme,
  palettes as v3Palettes,
} from "@ledgerhq/react-ui/styles/index";

type Props = {
  children: React.ReactNode;
  selectedPalette: "light" | "dark";
};

const StyleProviderV3 = ({ children, selectedPalette }: Props) => {
  // @ts-expect-error This is a hack to get the v2 palette in the v3 theme
  const theme: DefaultTheme = useMemo(
    () => ({
      ...defaultTheme,
      ...v3DefaultTheme,
      colors: {
        ...defaultTheme.colors,
        ...v3Palettes[selectedPalette],
        palette: { ...v2Palettes[selectedPalette], ...v3Palettes[selectedPalette] },
        v2Palette: v2Palettes[selectedPalette],
      },
      theme: selectedPalette,
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

export const withV3StyleProvider = <T,>(Component: React.ComponentType<T>) => {
  const WrappedComponent = (props: T & { children?: React.ReactNode }) => {
    const theme = useTheme();

    return (
      <StyleProviderV3 selectedPalette={theme.colors.type as "light" | "dark"}>
        <Component {...props} />
      </StyleProviderV3>
    );
  };
  return WrappedComponent;
};

export default StyleProviderV3;
