
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function klay({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M17.1252 5.89834C15.7209 4.73341 14.0102 4.12142 12.2824 4.06124L8.20339 14.758L17.1252 5.89834Z" fill={color} fillRule="nonzero" opacity={1} stroke="none" /><Path d="M18.1429 6.91L13.0187 11.9978L18.1417 17.0845C20.6175 14.146 20.6175 9.84957 18.1429 6.91Z" fill={color} fillRule="nonzero" opacity={1} stroke="none" /><Path d="M10.2778 5.28184L4.01702 11.4982C3.89467 13.4443 4.48816 15.4256 5.80093 17.0197L10.2778 5.28184Z" fill={color} fillRule="nonzero" opacity={1} stroke="none" /><Path d="M12.0001 13.0083L6.87601 18.0961C9.8366 20.5532 14.1637 20.5532 17.1231 18.095L12.0001 13.0083Z" fill={color} fillRule="nonzero" opacity={1} stroke="none" /></Svg>;
}
export default klay;