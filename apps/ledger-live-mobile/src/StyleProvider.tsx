import React, { useMemo } from "react";
import { ThemeProvider } from "styled-components/native";
import { palettes, defaultTheme } from "@ledgerhq/native-ui/styles/index";
import { lightTheme as light, darkTheme as dark } from "./colors";

const themes = { light, dark };

type Props = {
  children: React.ReactNode;
  selectedPalette: "light" | "dark";
};

export default function StyleProvider({ children, selectedPalette }: Props): React.ReactElement {
  const selectedTheme = themes[selectedPalette];
  const t = useMemo(
    () => ({
      ...defaultTheme,
      colors: {
        ...selectedTheme.colors,
        ...palettes[selectedPalette],
        palette: palettes[selectedPalette],
      },
      theme: selectedPalette,
    }),
    [selectedTheme.colors, selectedPalette],
  );

  return <ThemeProvider theme={t}>{children}</ThemeProvider>;
}
