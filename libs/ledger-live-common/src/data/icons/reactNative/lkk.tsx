
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function lkk({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M7.50375 19.875V17.133L12 12.555L16.482 17.1337V19.875L12 15.2955L7.50375 19.875ZM3.75 10.5998H10.1017L12 12.555H5.64825L3.75 10.5998ZM20.25 10.5998L18.3517 12.5543H12V4.125L13.8983 6.0645V10.5998H20.25Z" fill={color} /></Svg>;
}
export default lkk;