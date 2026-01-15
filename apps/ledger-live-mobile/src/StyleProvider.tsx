import React, { useMemo } from "react";
import { ThemeProvider } from "styled-components/native";
import { palettes, defaultTheme } from "@ledgerhq/native-ui/styles/index";
import { Theme as UITheme } from "@ledgerhq/native-ui/styles/theme";
import { lightTheme as light, darkTheme as dark } from "./colors";
import {
  ThemeProvider as LumenThemeProvider,
  Languages,
  type SupportedLocale,
} from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes as lumenThemes } from "@ledgerhq/lumen-design-core";
import { useSelector } from "~/context/hooks";
import { languageSelector } from "~/reducers/settings";

const themes = { light, dark };

type Props = {
  children: React.ReactNode;
  selectedPalette: "light" | "dark";
};

declare module "styled-components/native" {
  export interface DefaultTheme extends UITheme {}
}

const isValidLocale = (locale: string): locale is SupportedLocale => {
  return Object.values(Languages).some(l => l.id === locale);
};

export default function StyleProvider({ children, selectedPalette }: Props): React.ReactElement {
  const selectedLanguage = useSelector(languageSelector);
  const selectedTheme = themes[selectedPalette];
  const t = useMemo(
    () => ({
      ...defaultTheme,
      colors: {
        ...selectedTheme.colors,
        ...palettes[selectedPalette],
      },
      theme: selectedPalette,
    }),
    [selectedTheme.colors, selectedPalette],
  );

  const locale = useMemo((): SupportedLocale => {
    return isValidLocale(selectedLanguage) ? selectedLanguage : "en";
  }, [selectedLanguage]);

  return (
    <ThemeProvider theme={t}>
      <LumenThemeProvider themes={lumenThemes} colorScheme={selectedPalette} locale={locale}>
        {children}
      </LumenThemeProvider>
    </ThemeProvider>
  );
}
