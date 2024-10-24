import * as React from "react";
import { ColorValue } from "react-native";
import Svg, { Rect, Path, SvgProps } from "react-native-svg";

type Props = SvgProps & { size?: number; outline?: ColorValue };

export function Acre({ size = 32, outline = "white", ...props }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...props}>
      <Rect width="32" height="32" rx="5.33333" stroke={outline} fill="#F34900" />
      <Rect
        x="0.266667"
        y="0.266667"
        width="31.4667"
        height="31.4667"
        rx="5.06667"
        stroke="white"
        strokeOpacity="0.05"
        strokeWidth="0.533333"
      />
      <Path
        d="M18.7941 17.6958L18.056 16.6377H13.9161L13.178 17.6958H15.5078V18.8501H9.96873V17.6958H11.8429L14.6157 13.752H12.9533V12.5977H19.0187V13.752H17.3564L20.1291 17.6958H22.0033V18.8501H16.4706V17.6958H18.8005H18.7941ZM14.6157 15.6309H17.3499L15.9828 13.6878L14.6157 15.6309Z"
        fill="#F3E5C1"
      />
    </Svg>
  );
}
