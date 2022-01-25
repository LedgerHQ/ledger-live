// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

type Props = {
  color?: string,
  size?: number,
};

export default function BandwidthIcon({ color, size = 16 }: Props) {
  const { colors } = useTheme();
  return (
    <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} fill="none">
      <Path
        fill={color || colors.darkBlue}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.1819 18L18.1819 0H16.1819L16.1819 18H18.1819ZM14.091 3.27273L14.091 18H12.091L12.091 3.27273H14.091ZM10.0001 18L10.0001 8.18182H8.00006L8.00006 18H10.0001ZM5.90915 11.4545L5.90915 18H3.90915L3.90915 11.4545H5.90915ZM1.81824 14.7273V18H-0.181763V14.7273H1.81824Z"
      />
    </Svg>
  );
}
