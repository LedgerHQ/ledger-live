// @flow
import React from "react";
import color from "color";
import { useTheme } from "@react-navigation/native";
import { palettes } from "@ledgerhq/native-ui/styles";

export const ensureContrast = (color1: string, color2: string) => {
  const colorL1 = color(color1).luminosity() + 0.05;
  const colorL2 = color(color2).luminosity() + 0.05;

  const lRatio = colorL1 > colorL2 ? colorL1 / colorL2 : colorL2 / colorL1;

  if (lRatio < 1.5) {
    return color(color1)
      .rotate(180)
      .negate()
      .string();
  }
  return color1;
};

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

export function withTheme(Component: React$ComponentType<*>) {
  return (props: *) => {
    const { colors } = useTheme();
    return <Component colors={colors} {...props} />;
  };
}

const lightPrimary = palettes.light.primary.c80;
const lightPrimaryLight = palettes.light.primary.c20;

export const lightTheme = {
  dark: false,
  colors: {
    primary: "rgb(255, 45, 85)",
    background: "#fafafa",
    card: "#FFFFFF",
    text: "rgb(28, 28, 30)",
    border: "rgb(199, 199, 204)",
    notification: "rgb(255, 69, 58)",
    contrastBackground: "#142533",
    contrastBackgroundText: "#ffffff",
    /* MAIN */
    live: lightPrimary,
    alert: "#ea2e49",
    success: "#66BE54",
    darkBlue: "#142533",
    smoke: "#666666",
    grey: "#999999",
    fog: "#D8D8D8",
    white: "#ffffff",
    green: "rgb(102, 190, 84)",
    ledgerGreen: "#41ccb4",
    black: "#000000",
    orange: "#ff7701",
    yellow: "#ffd24a",
    separator: "#ebebeb",
    warning: "#ff9900",
    darkWarning: "#E08700",

    /* DERIVATIVES */
    lightLive: lightPrimaryLight,
    lightAlert: "#ea2e490c",
    lightFog: "#EEEEEE",
    lightGrey: "#F9F9F9",
    lightOrange: "#FF984F",
    translucentGreen: "rgba(102, 190, 84, 0.2)",
    translucentGrey: "rgba(153, 153, 153, 0.2)",
    lightLiveBg: lightPrimaryLight,

    errorBg: "#ff0042",

    /* PILLS */
    pillForeground: "#999999",
    pillActiveBackground: lightPrimaryLight,
    pillActiveForeground: lightPrimary,
    pillActiveDisabledForeground: "#999999",

    /** SNACKBAR */
    snackBarBg: "#142533",
    snackBarColor: "#FFF",

    /** SKELETON */
    skeletonBg: "#E9EAEB",
  },
};

const darkPrimary = palettes.dark.primary.c80;
const darkPrimaryLight = palettes.dark.primary.c20;

export const darkTheme = {
  dark: true,
  colors: {
    primary: "rgb(255, 45, 85)",
    card: "#1C1D1F",
    background: "#131415",
    text: "#FFFFFF",
    border: "rgba(255, 255, 255, 0.1)",
    notification: "rgb(255, 69, 58)",
    contrastBackground: "#223544",
    contrastBackgroundText: "#ffffff",
    /* MAIN */
    live: darkPrimary,
    alert: "#ea2e49",
    success: "#66BE54",
    darkBlue: "#FAFAFA",
    smoke: "#aaa",
    grey: "#aaa",
    fog: "#A8A8A8",
    white: "#000000",
    green: "rgb(102, 190, 84)",
    ledgerGreen: "#41ccb4",
    black: "#FFFFFF",
    orange: "#ff7701",
    yellow: "#ffd24a",
    separator: "#ebebeb",
    warning: "#ff9900",
    darkWarning: "#E08700",

    /* DERIVATIVES */
    lightLive: darkPrimaryLight,
    lightAlert: "#ea2e490c",
    lightFog: "#1c202b",
    lightGrey: "rgba(255,255,255, 0.05)",
    lightOrange: "#FF984F",
    translucentGreen: "rgba(102, 190, 84, 0.2)",
    translucentGrey: "rgba(153, 153, 153, 0.2)",
    lightLiveBg: darkPrimaryLight,

    errorBg: "#ff0042",

    /* PILLS */
    pillForeground: "#999999",
    pillActiveBackground: darkPrimaryLight,
    pillActiveForeground: darkPrimary,
    pillActiveDisabledForeground: "#999999",

    /** SNACKBAR */
    snackBarBg: "#000000",
    snackBarColor: "#FFF",

    /** SKELETON */
    skeletonBg: "#2a2d33",
  },
};
