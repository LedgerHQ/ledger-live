import React, { useMemo } from "react";
import { ThemeProvider } from "styled-components/native";
import theme from "@ledgerhq/native-ui/styles/theme";
import { palettes } from "@ledgerhq/native-ui/lib/styles";
import { lightTheme as light, darkTheme as dark } from "./colors";

const themes = { light, dark };

type Props = {
  children: React.ReactNode;
  selectedPalette: "light" | "dark";
};

export default function StyleProvider({
  children,
  selectedPalette,
}: Props): React.ReactElement {
  const defaultTheme = themes[selectedPalette];
  const t = useMemo(
    () => ({
      ...theme,
      colors: {
        ...defaultTheme.colors,
        ...palettes[selectedPalette],
        palette: palettes[selectedPalette],
      },
      theme: selectedPalette,
    }),
    [defaultTheme.colors, selectedPalette],
  );

  return <ThemeProvider theme={t}>{children}</ThemeProvider>;
}
