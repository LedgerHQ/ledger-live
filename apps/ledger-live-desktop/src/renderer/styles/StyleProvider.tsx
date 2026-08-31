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

// Desktop-scoped pinker background override (koda/pinker-background).
// Only overrides the app's main background token; does not touch the shared
// @ledgerhq/ui-shared palette (which also feeds ledger-live-mobile).
const PINK_BACKGROUND = {
  light: { default: "#FDEBF3", main: "#FDEBF3" },
  dark: { default: "#2A1620", main: "#2A1620" },
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
        background: {
          ...V3Palettes[v3SelectedPalette].background,
          ...defaultTheme.colors.background,
          ...PINK_BACKGROUND[v3SelectedPalette],
        },
      },
      theme: selectedPalette,
    }),
    [v3SelectedPalette, selectedPalette],
  );
  return (
    <PlatformStyleProvider theme={theme} colorScheme={selectedPalette}>
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
