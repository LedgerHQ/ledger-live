/* @flow */
import { StyleSheet } from "react-native";

type Opts = {
  bold?: boolean,
  semiBold?: boolean,
  secondary?: boolean,
  tertiary?: boolean,
};
type Res = {
  fontFamily: string,
  fontWeight: "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800",
};

const getFontStyle = ({
  bold,
  semiBold,
  secondary,
  tertiary,
}: Opts = {}): Res => {
  const fontFamily = secondary
    ? "Museo Sans"
    : tertiary
      ? "Rubik"
      : "Open Sans";
  let fontWeight = secondary ? -200 : 0; // Fix for Museo weights being off by 200;
  if (semiBold) {
    fontWeight += 600;
  } else if (bold) {
    fontWeight += 700;
  } else {
    fontWeight += 400;
  }
  return {
    fontFamily,
    // $FlowFixMe trust me it's one of the font weights!
    fontWeight: fontWeight.toString(),
  };
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
