import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};
export default function Pause({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.4167 15C13.0027 15 12.6667 14.44 12.6667 13.75V6.25C12.6667 5.56 13.0027 5 13.4167 5C13.8307 5 14.1667 5.56 14.1667 6.25V13.75C14.1667 14.44 13.8307 15 13.4167 15Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.75 15C6.336 15 6 14.44 6 13.75V6.25C6 5.56 6.336 5 6.75 5C7.164 5 7.5 5.56 7.5 6.25V13.75C7.5 14.44 7.164 15 6.75 15Z"
        fill={color}
      />
    </Svg>
  );
}
