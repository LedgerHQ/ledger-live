
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function flr({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path fill={color} d="M20.9,4.3c0,2-1.6,3-3.7,3h-12c0-2,1.6-3,3.7-3H20.9z M15.4,10.6c0,2-1.6,3-3.7,3H5.1c0-2,1.6-3,3.7-3H15.4z M8.1,19.2 c-0.7,0.7-1.8,0.7-2.5,0c-0.7-0.7-0.7-1.8,0-2.5c0.7-0.7,1.8-0.7,2.5,0C8.8,17.4,8.8,18.5,8.1,19.2z" /></Svg>;
}
export default flr;