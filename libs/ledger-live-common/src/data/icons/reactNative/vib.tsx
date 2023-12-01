
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function vib({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M6.375 5.25H9.525L14.925 14.8312V5.25H17.625V18.75H14.025L6.375 5.25Z" fill={color} /></Svg>;
}
export default vib;