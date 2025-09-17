import React from "react";
import Color from "color";
import uniqueId from "lodash/uniqueId";
import { colors, fontFamilies } from "./theme";
export const rgba = (c: string, a: number) => Color(c).alpha(a).rgb().toString();
export const darken = (c: string, a: number) => Color(c).darken(a).toString();
export const lighten = (c: string, a: number) => Color(c).lighten(a).toString();
export const mix = (c: string, b: string, a: number) => Color(c).mix(Color(b), a).toString();
export const ff = (v: string) => {
  const [font, type = "Regular"] = v.split("|");
  // @ts-expect-error let's assume that font is a key of fontFamilies
  const { style, weight } = fontFamilies[font][type];
  // @ts-expect-error let's assume that font is a key of fontFamilies
  const fallback = fontFamilies[font].fallback || "Arial";
  return {
    fontFamily: `${font}, ${fallback}`,
    fontWeight: weight,
    fontStyle: style,
  };
};
export const multiline = (str: string): React.ReactNode[] =>
  str.split("\n").map(line => <p key={uniqueId()}>{line}</p>);

export function getMarketColor({ isNegative }: { isNegative: boolean }) {
  return isNegative ? colors.marketDown_western : colors.marketUp_western;
}
