
      // @ts-nocheck

      import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function dydx({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 19 19" fill={color}><G><Path d="M 12.082031 3.945312 L 4.257812 15.15625 L 6.660156 15.15625 L 14.527344 3.945312 Z M 12.082031 3.945312 " /><Path d="M 6.910156 3.945312 L 9.210938 7.25 L 8.011719 9.050781 L 4.457031 3.945312 Z M 6.910156 3.945312 " /><Path d="M 12.316406 15.160156 L 9.761719 11.503906 L 10.964844 9.753906 L 14.71875 15.160156 Z M 12.316406 15.160156 " /></G></Svg>;
}
export default dydx;