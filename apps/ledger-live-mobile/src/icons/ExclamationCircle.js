// @flow
import React from "react";
import Svg, { Defs, Mask, Use, Path, G } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

type Props = {
  size: number,
  color: string,
};

export default function ExclamationCircle({ size = 16, color }: Props) {
  const { colors } = useTheme();
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Defs>
        <Path
          id="a"
          d="M12 .375C5.58.375.375 5.582.375 12 .375 18.422 5.58 23.625 12 23.625S23.625 18.422 23.625 12C23.625 5.582 18.42.375 12 .375zm0 21A9.37 9.37 0 0 1 2.625 12 9.372 9.372 0 0 1 12 2.625 9.372 9.372 0 0 1 21.375 12 9.37 9.37 0 0 1 12 21.375zm1.969-4.875A1.971 1.971 0 0 1 12 18.469a1.971 1.971 0 0 1-1.969-1.969c0-1.086.883-1.969 1.969-1.969s1.969.883 1.969 1.969zm-3.814-9.91l.318 6.376c.015.299.262.534.562.534h1.93c.3 0 .547-.235.562-.534l.318-6.375A.562.562 0 0 0 13.284 6h-2.568a.562.562 0 0 0-.561.59z"
        />
      </Defs>
      <G fill="none" fillRule="evenodd">
        <Mask id="b" fill="#fff">
          <Use xlinkHref="#a" />
        </Mask>
        <G fill={color || colors.alert} mask="url(#b)">
          <Path d="M0 0h24v24H0z" />
        </G>
      </G>
    </Svg>
  );
}
