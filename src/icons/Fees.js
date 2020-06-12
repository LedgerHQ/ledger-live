// @flow
import React from "react";
import Svg, { Mask, Path, G, Rect } from "react-native-svg";
import colors from "../colors";

export default function Redelegate({
  size = 24,
  color = colors.darkBlue,
}: {
  size?: number,
  color?: string,
}) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 22 22"
    >
      <Mask
        id="mask0"
        width="22"
        height="22"
        x="0"
        y="0"
        maskUnits="userSpaceOnUse"
      >
        <Path
          fill="#C4C4C4"
          fillRule="evenodd"
          d="M9 0H0v22h22V0H9zm0 0c4.418 0 8 4.925 8 11s-3.582 11-8 11-8-4.925-8-11S4.582 0 9 0z"
          clipRule="evenodd"
        />
      </Mask>
      <G mask="url(#mask0)">
        <Path
          stroke={color}
          strokeWidth="1.5"
          d="M20.25 11c0 2.907-.805 5.505-2.066 7.356-1.265 1.854-2.934 2.894-4.684 2.894H10.75V.75h2.75c1.75 0 3.42 1.04 4.684 2.894 1.261 1.85 2.066 4.45 2.066 7.356z"
        />
      </G>
      <Path
        fill={color}
        fillRule="evenodd"
        d="M16.5 11c0 2.755-.814 5.188-2.056 6.896C13.2 19.606 11.61 20.5 10 20.5c-1.611 0-3.2-.895-4.444-2.604C4.314 16.188 3.5 13.755 3.5 11s.814-5.188 2.056-6.896C6.8 2.394 8.39 1.5 10 1.5c1.611 0 3.2.895 4.444 2.604C15.686 5.812 16.5 8.245 16.5 11zm1.293 2.5c.109-.647.177-1.315.199-2H20v-1h-2.008a14.918 14.918 0 00-.2-2H20v-1h-2.413c-.171-.7-.392-1.37-.657-2H19v-1h-2.545c-.187-.35-.388-.684-.603-1H18v-1h-2.922C13.697.938 11.928 0 10 0 5.582 0 2 4.925 2 11s3.582 11 8 11c1.928 0 3.697-.938 5.078-2.5H18v-1h-2.148c.215-.317.416-.65.603-1H19v-1h-2.07c.265-.63.486-1.3.657-2H20v-1h-2.207z"
        clipRule="evenodd"
      />
      <Rect width="8" height="2" x="6" y="10" fill={color} rx="1" />
    </Svg>
  );
}
