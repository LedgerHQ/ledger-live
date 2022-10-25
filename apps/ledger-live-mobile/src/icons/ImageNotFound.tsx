import React, { memo } from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  height?: number;
  width?: number;
  color?: string;
};

const ImageNotFound = ({ height, width, color }: Props) => (
  <Svg
    width={width ?? 52}
    height={height ?? 52}
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path
      d="M46.5 19.912v22.102A2 2 0 0144.516 44H8.484A1.986 1.986 0 016.5 42.014V9.986A2 2 0 018.484 8h25.732a10.106 10.106 0 00.409 4H10.5v28l18.584-18.588a2 2 0 012.828 0L42.5 32.02V19.64a10.01 10.01 0 004 .272z"
      fill={color ?? "#D6D8D9"}
    />
    <Path
      d="M15.672 22.828a4 4 0 105.656-5.656 4 4 0 00-5.656 5.656zM45 16a7 7 0 110-14 7 7 0 010 14zm-.7-4.9v1.4h1.4v-1.4h-1.4zm1.4-1.152A2.451 2.451 0 0045 5.15a2.45 2.45 0 00-2.403 1.97l1.373.274A1.05 1.05 0 1145 8.65a.7.7 0 00-.7.7v1.05h1.4v-.452z"
      fill={color ?? "#D6D8D9"}
    />
  </Svg>
);

export default memo(ImageNotFound);
