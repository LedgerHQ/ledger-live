import React from "react";
import Svg, { G, Path } from "react-native-svg";

type Props = {
  size?: number;
  color: string;
};

export default function Building({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size} fill="none">
      <G stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M1.33333 14H14.6667" />
        <Path d="M14 14V2.66667C14 2.48986 13.9298 2.32029 13.8047 2.19526C13.6797 2.07024 13.5101 2 13.3333 2H6.66667C6.48986 2 6.32029 2.07024 6.19526 2.19526C6.07024 2.32029 6 2.48986 6 2.66667V14" />
        <Path d="M8 4.66667H12" />
        <Path d="M8 6.66667H12" />
        <Path d="M8 8.66666H12" />
        <Path d="M2 14V5.33333C2 5.15652 2.07024 4.98695 2.19526 4.86193C2.32029 4.73691 2.48986 4.66667 2.66667 4.66667H6" />
        <Path d="M12 14V11.5" />
        <Path d="M8 11.5V13.6667" />
        <Path d="M12 11.3333H8" />
      </G>
    </Svg>
  );
}
