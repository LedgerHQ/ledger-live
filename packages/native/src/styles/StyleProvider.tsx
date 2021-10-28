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
  export interface DefaultTheme extends Theme {
    sizes: {
      topBarHeight: number;
      sideBarWidth: number;
    };
    radii: number[];
    fontSizes: number[];
    space: number[];
    colors: Record<string, any>;
    zIndexes: number[];
  }
}

export const StyleProvider = ({
  children,
  selectedPalette,
}: Props): React.ReactElement => {
  const theme: Theme = useMemo(
    () => ({
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        palette: palettes[selectedPalette],
      },
      theme: selectedPalette,
    }),
    [selectedPalette]
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
