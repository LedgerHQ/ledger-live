
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function storm({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path fillRule="evenodd" clipRule="evenodd" d="M17.25 4.5L8.22825 10.6875L12.7853 13.5938L6.75 19.5L16.7265 12.594L12.231 9.68775L17.25 4.5Z" fill={color} /></Svg>;
}
export default storm;