import Color from "color";

import { fontFamilies } from "./theme";

export const rgba = (c: string, a: number): string => Color(c).alpha(a).rgb().toString();

export const darken = (c: string, a: number): string => Color(c).darken(a).toString();

export const lighten = (c: string, a: number): string => Color(c).lighten(a).toString();

export const mix = (c: string, b: string, a: number): string =>
  Color(c).mix(Color(b), a).toString();

export const ff = (v: string) => {
  const [font, type = "Regular"] = v.split("|");
  // @ts-expect-error FIXME
  const { style, weight } = fontFamilies[font][type];
  // @ts-expect-error FIXME
  const fallback: string = fontFamilies[font].fallback ?? "Arial";

  return {
    fontFamily: `${font}, ${fallback}`,
    fontWeight: weight,
    fontStyle: style,
  };
};

export const ensureContrast = (color1: string, color2: string) => {
  const colorL1 = Color(color1).luminosity() + 0.05;
  const colorL2 = Color(color2).luminosity() + 0.05;

  const lRatio = colorL1 > colorL2 ? colorL1 / colorL2 : colorL2 / colorL1;

  if (lRatio < 1.5) {
    return Color(color1).rotate(180).negate().string();
  }
  return color1;
};
