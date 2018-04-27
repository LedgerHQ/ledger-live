//@flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string
};

export default function Digibyte({ size, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M9.513 11.364a7.208 7.208 0 0 0 3.358-2.915 3.56 3.56 0 0 0 .507-2.398c-.236-1.173-1.131-1.613-3.178-1.607H1.737v-1.7h8.46c2.758-.008 4.411.804 4.854 3.01a5.273 5.273 0 0 1-.734 3.588c-1.02 1.67-2.433 2.844-4.126 3.58-1.864.812-3.798 1.013-5.469.88a5.976 5.976 0 0 1-.351-.038l-.984-.141 2.62-8.501 1.625.5-2.009 6.516c1.233.006 2.596-.211 3.89-.774zm-1.23-7.77h-1.7V0h1.7v3.594zm2.358 0h-1.7V0h1.7v3.594zM8.283 16h-1.7v-3.594h1.7V16zm2.358 0h-1.7v-3.594h1.7V16z"
      />
    </Svg>
  );
}
