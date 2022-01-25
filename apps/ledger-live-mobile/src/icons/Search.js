// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function Search({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" height={size} width={size}>
      <Path
        fill={color}
        d="M12.654 11.594l2.876 2.876a.75.75 0 0 1-1.06 1.06l-2.876-2.876a6.972 6.972 0 1 1 1.06-1.06zm-1.492-.574a5.472 5.472 0 1 0-.142.142.757.757 0 0 1 .142-.142z"
      />
    </Svg>
  );
}
