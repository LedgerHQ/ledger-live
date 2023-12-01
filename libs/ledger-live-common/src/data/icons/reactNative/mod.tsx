
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function mod({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path opacity={0.5} d="M17.2444 15.7609V6.06561L12.5104 10.9024L17.2444 15.7609Z" fill={color} /><Path d="M6.75562 5.25562L6.98362 5.48962L13.3339 11.9959L6.75562 18.7444V5.25562Z" fill={color} /></Svg>;
}
export default mod;