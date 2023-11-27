
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function elec({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M8.28522 20.8451L17.7847 10.8679H12.0352L8.28522 20.8451Z" fill={color} /><Path d="M6.21524 13.8574H11.9647L17.7847 10.8679H12.0352L6.21524 13.8574Z" fill={color} /><Path d="M14.8477 3.15488L6.21524 13.8574H11.9647L14.8477 3.15488Z" fill={color} /></Svg>;
}
export default elec;