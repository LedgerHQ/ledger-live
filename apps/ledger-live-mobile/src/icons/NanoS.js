// @flow

import * as React from "react";
import { useTheme } from "@react-navigation/native";
import Svg, { Mask, Path, G, Circle } from "react-native-svg";

type Props = {
  size?: number,
  color?: string,
  style?: *,
};

export default function NanoS({ size, color, style }: Props) {
  const { colors } = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <Mask
        id="mask0"
        mask-type="alpha"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="16"
        height="12"
      >
        <Path d="M0 0H16V12L13.8182 10.1818H0V0Z" fill="#fff" />
      </Mask>
      <G mask="url(#mask0)">
        <Mask id="path-2-inside-1" fill={color || colors.white}>
          <Path d="M4.98786 0.0668278C5.02477 0.02992 5.08461 0.0299197 5.12152 0.0668275L14.9932 9.93851C16.1293 11.0746 16.1293 12.9165 14.9932 14.0526C13.8571 15.1887 12.0152 15.1887 10.8791 14.0526L1.00744 4.1809C0.970532 4.144 0.970532 4.08416 1.00744 4.04725L4.98786 0.0668278Z" />
        </Mask>
        <Path
          d="M4.06085 1.12749L13.9325 10.9992L16.0539 8.87785L6.18218 -0.993833L4.06085 1.12749ZM11.9398 12.9919L2.0681 3.12024L-0.0532205 5.24156L9.81846 15.1132L11.9398 12.9919ZM2.0681 5.10791L6.04852 1.12749L3.9272 -0.993832L-0.0532208 2.98659L2.0681 5.10791ZM2.0681 3.12024C2.61697 3.66911 2.61699 4.55902 2.0681 5.10791L-0.0532208 2.98659C-0.675924 3.60929 -0.675906 4.61888 -0.0532205 5.24156L2.0681 3.12024ZM13.9325 12.9919C13.3822 13.5422 12.4901 13.5422 11.9398 12.9919L9.81846 15.1132C11.5403 16.8351 14.332 16.8351 16.0539 15.1132L13.9325 12.9919ZM13.9325 10.9992C14.4828 11.5495 14.4828 12.4416 13.9325 12.9919L16.0539 15.1132C17.7757 13.3914 17.7757 10.5997 16.0539 8.87785L13.9325 10.9992ZM6.18218 -0.993833C5.55948 -1.61653 4.54989 -1.61652 3.9272 -0.993832L6.04852 1.12749C5.49965 1.67636 4.60974 1.67637 4.06085 1.12749L6.18218 -0.993833Z"
          fill={color || colors.white}
          mask="url(#path-2-inside-1)"
        />
      </G>
      <Path
        d="M0.75 10.2045H13.0909C14.2833 10.2045 15.25 11.1712 15.25 12.3636C15.25 13.5561 14.2833 14.5227 13.0909 14.5227H0.75V10.2045Z"
        stroke={color || colors.white}
        strokeWidth="1.5"
      />
      <Circle
        cx="13.1269"
        cy="12.3636"
        r="0.909091"
        fill={color || colors.white}
      />
    </Svg>
  );
}
