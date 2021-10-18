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
