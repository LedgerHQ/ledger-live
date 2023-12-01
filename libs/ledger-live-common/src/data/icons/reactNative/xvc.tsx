
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function xvc({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path fillRule="evenodd" clipRule="evenodd" d="M6.8385 8.05725H5.25L6.498 6H9.5985V14.0377L15.5355 6H18.75L10.3928 18H6.8385V8.05725Z" fill={color} /></Svg>;
}
export default xvc;