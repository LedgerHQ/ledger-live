// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function Location({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 25 36" width={size} height={size}>
      <Path
        fill={color}
        d="M12.5 36C4.167 26.699 0 18.833 0 12.402 0 5.552 5.596 0 12.5 0S25 5.553 25 12.402c0 6.43-4.167 14.297-12.5 23.598zm0-16a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z"
      />
    </Svg>
  );
}
