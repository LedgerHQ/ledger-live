import React from "react";
import { ThemeProvider as SCNativeThemeProvider } from "styled-components/native";
import {
  ThemeProvider as LumenThemeProvider,
  type SupportedLocale,
} from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import type { DefaultTheme } from "styled-components/native";

interface StyleProviderProps {
  /** Pre-merged theme object (app is responsible for merging via @ledgerhq/native-ui tokens). */
  theme: DefaultTheme;
  selectedPalette: "light" | "dark";
  /** Lumen locale — app derives this from Redux (languageSelector) and passes it as a prop. */
  locale: SupportedLocale;
  children: React.ReactNode;
}

export function StyleProvider({ theme, selectedPalette, locale, children }: StyleProviderProps) {
  return (
    <SCNativeThemeProvider theme={theme}>
      <LumenThemeProvider themes={ledgerLiveThemes} colorScheme={selectedPalette} locale={locale}>
        {children}
      </LumenThemeProvider>
    </SCNativeThemeProvider>
  );
}
