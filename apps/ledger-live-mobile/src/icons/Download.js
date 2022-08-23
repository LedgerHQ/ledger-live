import * as React from "react";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

type Props = {
  size?: number,
  color?: string,
  style?: any,
};

export default ({ size = 16, color, style }: Props) => {
  const { colors } = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <Path
        d="M23.906 16.063h-3.45l1.743-1.707c1.113-1.114.297-3.043-1.262-3.043h-2.375V7.155c0-.965-.816-1.781-1.78-1.781h-3.563a1.782 1.782 0 00-1.781 1.781v4.157H9.062c-1.595 0-2.412 1.93-1.261 3.042l1.707 1.707H6.094a1.782 1.782 0 00-1.782 1.782v4.75c0 1.002.78 1.781 1.782 1.781h17.812c.965 0 1.782-.78 1.782-1.781v-4.75c0-.965-.817-1.782-1.782-1.782zm-14.843-2.97h4.156V7.157h3.562v5.938h4.157L15 19.03l-5.938-5.937zm14.843 9.5H6.094v-4.75h5.195l2.45 2.45a1.726 1.726 0 002.486 0l2.449-2.45h5.232v4.75zm-3.265-2.374c0 .52.37.89.89.89a.88.88 0 00.89-.89.903.903 0 00-.89-.89.88.88 0 00-.89.89z"
        fill={color || colors.black}
      />
    </Svg>
  );
};
