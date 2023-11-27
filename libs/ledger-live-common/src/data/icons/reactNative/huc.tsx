
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function huc({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path fillRule="evenodd" clipRule="evenodd" d="M8.625 10.875H15.375V7.5H17.625V19.5H15.375V13.125H8.625V16.5H6.375V4.5H8.625V10.875Z" fill={color} /></Svg>;
}
export default huc;