// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
  bgColor?: string,
};

export default function WarningOutline({ size = 16, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M11.691 3.44908L18.0735 14.6191C18.8151 15.9174 17.8776 17.5332 16.3826 17.5332H3.61763C2.12179 17.5332 1.18429 15.9174 1.92679 14.6191L8.30929 3.44908C9.05679 2.13992 10.9435 2.13992 11.691 3.44908Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.99992 10.9332V7.81653"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.99909 13.4373C9.88409 13.4373 9.79075 13.5307 9.79159 13.6457C9.79159 13.7607 9.88492 13.854 9.99992 13.854C10.1149 13.854 10.2083 13.7607 10.2083 13.6457C10.2083 13.5307 10.1149 13.4373 9.99909 13.4373"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
