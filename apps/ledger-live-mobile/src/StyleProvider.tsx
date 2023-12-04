import React, { useMemo } from "react";
import { ThemeProvider } from "styled-components/native";
import theme, { type Theme as ThemeObjectType } from "@ledgerhq/native-ui/styles/theme";
import { palettes } from "@ledgerhq/native-ui/styles/index";

type AvailablePalettes = "light" | "dark";

export type PaletteType = typeof palettes.dark;

export type ThemeType = ThemeObjectType & {
  colors: PaletteType;
  palette: AvailablePalettes;
};

type GetThemeProps = {
  selectedPalette: AvailablePalettes;
};

export const getTheme = ({ selectedPalette }: GetThemeProps): ThemeType => {
  return {
    ...theme,
    colors: {
      ...palettes[selectedPalette],
      palette: palettes[selectedPalette],
    },
    palette: selectedPalette,
  };
};

type Props = {
  children: React.ReactNode;
  selectedPalette: AvailablePalettes;
};

export default function StyleProvider({ children, selectedPalette }: Props): React.ReactElement {
  const t = useMemo(() => getTheme({ selectedPalette }), [selectedPalette]);

  return <ThemeProvider theme={t}>{children}</ThemeProvider>;
}

declare module "styled-components/native" {
  export type T = ThemeType;
  export function useTheme(): T;
}
