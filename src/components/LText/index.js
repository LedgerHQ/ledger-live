/* @flow */
import React, { memo, useMemo } from "react";
import { Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import getFontStyle from "./getFontStyle";

export { getFontStyle };

export type Opts = {
  bold?: boolean,
  semiBold?: boolean,
  secondary?: boolean,
  monospace?: boolean,
  color?: string,
  bg?: string,
};

export type Res = {|
  fontFamily: string,
  fontWeight:
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900",
|};

const getColor = (clrs, key, defaultValue) => {
  if (!key || !(key in clrs)) {
    return defaultValue;
  }

  return clrs[key];
};

/**
 * Usage:
 *
 * <LText>123</LText>
 * <LText bold>toto</LText>
 * <LText semiBold>foobar</LText>
 * <LText secondary>alternate font</LText>
 * <LText style={styles.text}>some specific styles</LText>
 */
function LText({
  bold,
  semiBold,
  secondary,
  monospace,
  color,
  bg,
  style,
  ...newProps
}: {
  ...Opts,
  style?: *,
  ...
}) {
  const { colors } = useTheme();

  const memoizedStyle = useMemo(
    () => [
      {
        color: getColor(colors, color, colors.darkBlue),
        backgroundColor: getColor(colors, bg, "transparent"),
      },
      style,
      getFontStyle({
        bold,
        semiBold,
        secondary,
        monospace,
      }),
    ],
    [colors, style, bold, semiBold, secondary, monospace, bg],
  );

  return (
    // $FlowFixMe
    <Text {...newProps} allowFontScaling={false} style={memoizedStyle} />
  );
}

export default memo<{
  ...Opts,
  style?: *,
  ...
}>(LText);
