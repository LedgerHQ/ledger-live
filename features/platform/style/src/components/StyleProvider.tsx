import React from "react";
import { ThemeProvider as SCThemeProvider } from "styled-components";
import { ThemeProvider as LumenThemeProvider } from "@ledgerhq/lumen-ui-react";
import type { DefaultTheme } from "styled-components";

type ColorScheme = "light" | "dark" | "system";

interface StyleProviderProps {
  /** Pre-merged theme object (app is responsible for merging via @ledgerhq/react-ui tokens). */
  theme?: DefaultTheme;
  /** Lumen color scheme — renders LumenThemeProvider when provided (e.g. web-tools). */
  colorScheme?: ColorScheme;
  children: React.ReactNode;
}

export function StyleProvider({ theme, colorScheme, children }: StyleProviderProps) {
  let content: React.ReactNode = children;

  if (colorScheme !== undefined) {
    content = <LumenThemeProvider colorScheme={colorScheme}>{content}</LumenThemeProvider>;
  }

  if (theme !== undefined) {
    return <SCThemeProvider theme={theme}>{content}</SCThemeProvider>;
  }

  return <>{content}</>;
}
