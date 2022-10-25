import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number;
  color: string;
} & Partial<React.ComponentProps<typeof Svg>>;
export default function Alert({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M8 2a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 12a1.2 1.2 0 1 1 0-2.4A1.2 1.2 0 0 1 8 14z"
      />
    </Svg>
  );
}
