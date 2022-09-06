import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number;
  color: string;
};
export default function ArrowLeft({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M3.117 7.913l4.529 4.528a.913.913 0 0 1-1.292 1.292L.267 7.646a.913.913 0 0 1 0-1.292L6.354.267A.913.913 0 1 1 7.646 1.56L3.117 6.087h9.97a.913.913 0 1 1 0 1.826h-9.97z"
      />
    </Svg>
  );
}
