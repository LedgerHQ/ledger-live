import React, { memo } from "react";
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";

type Props = {
  size?: number;
};

const RaribleIcon = ({ size }: Props) => (
  <Svg
    width={size ?? 32}
    height={size ?? 32}
    viewBox="0 0 32 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <G clipPath="url(#clip0_387:5693)">
      <Path
        d="M25.6.968H6.4a6.4 6.4 0 00-6.4 6.4v19.2a6.4 6.4 0 006.4 6.4h19.2a6.4 6.4 0 006.4-6.4v-19.2a6.4 6.4 0 00-6.4-6.4z"
        fill="#FEDA03"
      />
      <Path
        d="M22.08 16.85c1.009-.261 1.905-1.015 1.905-2.531 0-2.524-2.143-3.111-4.889-3.111H8.16v11.365h4.603v-3.857h5.46c.842 0 1.334.333 1.334 1.159v2.698h4.603v-2.841c0-1.548-.873-2.524-2.08-2.881zm-3.777-1.198h-5.54v-1.11h5.54c.603 0 .968.079.968.555 0 .476-.365.555-.968.555z"
        fill="#000"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_387:5693">
        <Path fill="#fff" transform="translate(0 .968)" d="M0 0H32V32H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default memo(RaribleIcon);
