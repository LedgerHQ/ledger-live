import React, { useMemo } from "react";
import { StyleProvider as PlatformStyleProvider } from "@features/platform-style";
import { palettes, defaultTheme } from "@ledgerhq/native-ui/styles/index";
import { Theme as UITheme } from "@ledgerhq/native-ui/styles/theme";
import { lightTheme as light, darkTheme as dark } from "./colors";
import { Languages, type SupportedLocale } from "@ledgerhq/lumen-ui-rnative";
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
    <PlatformStyleProvider theme={t} selectedPalette={selectedPalette} locale={locale}>
      {children}
    </PlatformStyleProvider>
  );
}
