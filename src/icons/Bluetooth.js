// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function Bluetooth({ size = 16, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 16" fill="none">
      <Path
        d="M8.00546 8.12572L12.2508 4.89656L5.56002 0V6.44781L1.61327 3.75684L0.173828 4.73825L5.12662 8.12572L0.173828 11.5132L1.61327 12.4946L5.56002 9.80363L5.68446 16L12.4931 11.3549L8.00546 8.12572ZM9.87821 4.90709L7.5876 6.46891L7.57211 3.33469L9.87821 4.90709ZM7.5876 9.7825L9.87821 11.3443L7.57211 12.9167L7.5876 9.7825Z"
        fill={color}
      />
    </Svg>
  );
}
