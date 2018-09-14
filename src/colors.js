// @flow
import color from "color";

export const rgba = (c: string, a: number) =>
  color(c)
    .alpha(a)
    .rgb()
    .toString();

export const darken = (c: string, a: number) =>
  color(c)
    .darken(a)
    .toString();

export const lighten = (c: string, a: number) =>
  color(c)
    .lighten(a)
    .toString();

export default {
  /* MAIN */
  live: "#6490f1",
  alert: "#ea2e49",
  success: "#66BE54",
  darkBlue: "#142533",
  smoke: "#666666",
  grey: "#999999",
  fog: "#D8D8D8",
  white: "#ffffff",
  green: "rgb(102, 190, 84)",
  black: "#000000",

  /* DERIVATIVES */
  lightLive: "#4b84ff19",
  lightAlert: "#ea2e490c",
  lightFog: "#EEEEEE",
  lightGrey: "#F9F9F9",
  translucentGreen: "rgba(102, 190, 84, 0.2)",
  translucentGrey: "rgba(153, 153, 153, 0.2)",

  errorBg: "#ff0042",

  /* PILLS */
  pillForeground: "#999999",
  pillActiveBackground: rgba("#6490f1", 0.1),
  pillActiveForeground: "#6490f1",
};
