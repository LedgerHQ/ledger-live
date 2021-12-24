import React, { useMemo } from "react";
import { ThemeProvider } from "styled-components/native";
import defaultTheme from "./theme";
import { palettes, ThemeNames } from "@ledgerhq/ui-shared";
import { Theme } from "./theme";

type Props = {
  children: React.ReactNode;
  selectedPalette: ThemeNames;
};

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends Theme {}
}

export const StyleProvider = ({ children, selectedPalette }: Props): React.ReactElement => {
  const theme: Theme = useMemo(
    () => ({
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        ...palettes[selectedPalette],
        palette: palettes[selectedPalette],
      },
      theme: selectedPalette,
    }),
    [selectedPalette],
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
