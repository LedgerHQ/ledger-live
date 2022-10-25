import { StyleSheet } from "react-native";
import type { Opts, Res } from ".";

const getFontStyle = ({ bold, semiBold, monospace }: Opts = {}): Res => {
  const fontFamily = monospace ? "Menlo" : "Inter";
  let fontWeight;

  if (semiBold) {
    fontWeight = "600";
  } else if (bold) {
    fontWeight = "700";
  } else {
    fontWeight = "400";
  }

  return {
    fontFamily,
    fontWeight,
  };
};

const cache = StyleSheet.create({});

const cachedGetFontStyle = (opts: Opts = {}): Res => {
  const r = getFontStyle(opts);
  const key = `${r.fontFamily}_${r.fontWeight}`;

  if (cache[key]) {
    return cache[key];
  }

  const { style } = StyleSheet.create({
    style: r,
  });
  cache[key] = style;
  return style;
};

export default cachedGetFontStyle;
