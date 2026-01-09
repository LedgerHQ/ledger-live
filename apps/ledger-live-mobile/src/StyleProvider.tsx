import React, { useMemo } from "react";
import { ThemeProvider } from "styled-components/native";
import { palettes, defaultTheme } from "@ledgerhq/native-ui/styles/index";
import { Theme as UITheme } from "@ledgerhq/native-ui/styles/theme";
import { lightTheme as light, darkTheme as dark } from "./colors";

const themes = { light, dark };

type Props = {
  children: React.ReactNode;
  selectedPalette: "light" | "dark";
};

declare module "styled-components/native" {
  export interface DefaultTheme extends UITheme {}
}

export default function StyleProvider({ children, selectedPalette }: Props): React.ReactElement {
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

  return <ThemeProvider theme={t}>{children}</ThemeProvider>;
}
