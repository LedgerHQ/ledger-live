
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function tifi({ size, color }: Props) {
  return <Svg height={size} width={size} viewBox="0 0 24 24" fill="none"><Path d="M1.11627 15.1627L8.93023 7.34883L12.2790 7.34883L15.0697 10.13953L13.3953 11.81395L10.6046 9.02325L4.46511 15.1627ZM8.93023 14.0465L10.6046 12.37209L13.3953 15.1627L19.5348 9.02325L22.8837 9.02325L15.0697 16.8372L11.7209 16.8372Z" fill={color} /></Svg>;
}
export default tifi;