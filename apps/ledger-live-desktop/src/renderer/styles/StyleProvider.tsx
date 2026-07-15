import "@ledgerhq/react-ui/assets/fonts";
import React, { useMemo } from "react";
import { DefaultTheme } from "styled-components";
import defaultTheme from "./theme";
import { GlobalStyle } from "./global";
import {
  defaultTheme as V3DefaultTheme,
  palettes as V3Palettes,
} from "@ledgerhq/react-ui/styles/index";
import { StyleProvider as PlatformStyleProvider } from "@features/platform-style";
import { useSelector } from "LLD/hooks/redux";
import { themeSelector } from "../actions/general";

type Props = {
  children: React.ReactNode;
  selectedPalette: "light" | "dark";
};

const StyleProvider = ({ children, selectedPalette }: Props) => {
  const v3SelectedPalette = selectedPalette === "light" ? "light" : "dark";
  // @ts-expect-error This is a hack to get the v2 palette in the v3 theme
  const theme: DefaultTheme = useMemo(
    () => ({
      ...V3DefaultTheme,
      ...defaultTheme,
      colors: {
        ...V3Palettes[v3SelectedPalette],
        ...defaultTheme.colors,
      },
      theme: selectedPalette,
    }),
    [v3SelectedPalette, selectedPalette],
  );
  return (
    <PlatformStyleProvider theme={theme}>
      <GlobalStyle />
      {children}
    </PlatformStyleProvider>
  );
};

export const withV2StyleProvider = <T,>(Component: React.ComponentType<T>) => {
  const WrappedComponent = (props: T & { children?: React.ReactNode }) => {
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
