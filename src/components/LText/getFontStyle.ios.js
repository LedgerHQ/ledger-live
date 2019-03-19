/* @flow */
import { StyleSheet } from "react-native";
import type { Opts, Res } from ".";

const getFontStyle = ({
  bold,
  semiBold,
  secondary,
  tertiary,
  monospace,
}: Opts = {}): Res => {
  const fontFamily = secondary
    ? "Museo Sans"
    : tertiary
      ? "Rubik"
      : monospace
        ? "Menlo"
        : "Open Sans";
  let fontWeight;
  if (semiBold) {
    fontWeight = secondary ? "400" : "600"; // Fix for Museo weights being off by 200;
  } else if (bold) {
    fontWeight = secondary ? "500" : "700";
  } else {
    fontWeight = secondary ? "200" : "400";
  }
  return { fontFamily, fontWeight };
};

const cache = StyleSheet.create({});

const cachedGetFontStyle = (opts: Opts = {}) => {
  const r = getFontStyle(opts);
  const key = `${r.fontFamily}_${r.fontWeight}`;
  if (cache[key]) {
    return cache[key];
  }
  const { style } = StyleSheet.create({ style: r });
  cache[key] = style;
  return style;
};

export default cachedGetFontStyle;
