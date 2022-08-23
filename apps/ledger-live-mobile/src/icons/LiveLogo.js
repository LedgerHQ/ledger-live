// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function LiveLogo({ size = 16, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.6829 37.6829L22.6829 41.3415L26.3414 41.3415L37.317 41.3415L37.317 37.6829L26.3414 37.6829L26.3414 18.6585L22.6829 18.6585L22.6829 37.6829Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M56.3415 0H60V3.65854V14.6341H56.3415V3.65854H37.3171V0H56.3415Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M56.3415 60H60V56.3415V45.3659H56.3415V56.3415H37.3171V60H56.3415Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.65854 0H0V3.65854V14.6341H3.65854V3.65854H22.6829V0H3.65854Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.65854 60H0V56.3415V45.3659H3.65854V56.3415H22.6829V60H3.65854Z"
        fill={color}
      />
    </Svg>
  );
}
