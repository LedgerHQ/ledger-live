import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
  bgColor?: string;
};
export default function Warning({ size = 16, color, bgColor = "white" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 16" fill="none">
      <Path
        d="M0.207634 12.1704L5.97362 2.33512C6.62641 1.22162 8.37359 1.22163 9.02638 2.33513L14.7924 12.1704C15.4103 13.2245 14.5746 14.5 13.266 14.5H1.73402C0.425374 14.5 -0.410336 13.2245 0.207634 12.1704Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.5 6C8.5 5.44772 8.05228 5 7.5 5C6.94772 5 6.5 5.44772 6.5 6V8.5C6.5 9.05228 6.94772 9.5 7.5 9.5C8.05228 9.5 8.5 9.05228 8.5 8.5V6ZM7.49913 12.5C8.01466 12.5 8.43259 12.0821 8.43259 11.5665C8.43259 11.051 8.01466 10.6331 7.49913 10.6331C6.9836 10.6331 6.56567 11.051 6.56567 11.5665C6.56567 12.0821 6.9836 12.5 7.49913 12.5Z"
        fill={bgColor}
      />
    </Svg>
  );
}
