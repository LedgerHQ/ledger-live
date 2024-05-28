
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function r({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M7.125 18.4785L9.72525 17.1195V8.05875L13.4393 10.1423L10.6537 11.592V14.5823L16.875 18.75V15.9412L13.068 13.314L16.2247 11.6827V8.78325L9.72525 5.25L7.125 6.609V18.4785Z" fill={color} /></Svg>;
}
export default r;