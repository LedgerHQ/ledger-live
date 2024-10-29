import * as React from "react";
import type { ColorValue } from "react-native";
import Svg, { type SvgProps, Path, Rect } from "react-native-svg";

type Props = SvgProps & { size?: number; color?: string; outline?: ColorValue };

const BASE_SIZE = 32;

export function Figment({ size = BASE_SIZE, outline, ...props }: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...props}>
      <Rect
        fill="#FFF29B"
        width="31"
        height="31"
        rx={7.5}
        stroke-opacity={0.1}
        stroke={outline}
        x={0.5}
        y={0.5}
      />
      <Path fill="#111" d="M12.484 9.8v4.68h10.048v2.918H12.484v7.768H8.917V6.833h14.166V9.8z" />
    </Svg>
  );
}
