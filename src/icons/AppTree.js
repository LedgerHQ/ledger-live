// @flow
import React from "react";
import Svg, { Path, G, Rect, Image } from "react-native-svg";
import manager from "@ledgerhq/live-common/lib/manager";

type Props = {
  size: number,
  color: string,
  icon: string,
};

export default function AppTree({ size = 163, color, icon }: Props) {
  const uri = manager.getIconUrl(icon);

  return (
    <Svg
      width={size}
      height={size * (108 / 163)}
      viewBox="0 0 163 108"
      fill="none"
    >
      <G opacity="0.25">
        <Rect x="141" y="86" width="22" height="22" rx="6.94737" fill={color} />
      </G>
      <G opacity="0.25">
        <Rect x="94" y="86" width="22" height="22" rx="6.94737" fill={color} />
      </G>
      <G opacity="0.25">
        <Rect x="47" y="86" width="22" height="22" rx="6.94737" fill={color} />
      </G>
      <G opacity="0.25">
        <Rect y="86" width="22" height="22" rx="6.94737" fill={color} />
      </G>
      <Image x="57" width="50" height="50" rx="15.7895" href={uri} />
      <Path
        d="M82 61V69.5H13C11.8954 69.5 11 70.3954 11 71.5V78"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M82 61V69.5H60C58.8954 69.5 58 70.3954 58 71.5V78"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M82 61V69.5H150C151.105 69.5 152 70.3954 152 71.5V78"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M82 58V69.5H103C104.105 69.5 105 70.3954 105 71.5V78"
        stroke={color}
        strokeWidth="1.5"
      />
    </Svg>
  );
}
