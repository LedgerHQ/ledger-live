import React from "react";
import color from "color";
import { useTheme } from "styled-components/native";
import { DefaultTheme } from "styled-components/native";
import type { ThemeType } from "./StyleProvider";
import { PaletteType } from "./StyleProvider";

export type Theme = ThemeType;

export const ensureContrast = (color1: string, color2: string) => {
  const colorL1 = color(color1).luminosity() + 0.05;
  const colorL2 = color(color2).luminosity() + 0.05;

  const lRatio = colorL1 > colorL2 ? colorL1 / colorL2 : colorL2 / colorL1;

  if (lRatio < 1.5) {
    return color(color1).rotate(180).negate().string();
  }
  return color1;
};

export const rgba = (c: string, a: number) => color(c).alpha(a).rgb().toString();

export const darken = (c: string, a: number) => color(c).darken(a).toString();

export const lighten = (c: string, a: number) => color(c).lighten(a).toString();

export function withTheme<P>(Component: React.ComponentType<P>) {
  return (
    props: Omit<P, "colors"> & {
      colors?: Partial<PaletteType | DefaultTheme["colors"]>;
    },
  ) => {
    const { colors } = useTheme();
    return <Component colors={colors} {...(props as P)} />;
  };
}
