
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function nav({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path fillRule="evenodd" clipRule="evenodd" d="M15.99 16.5H12.393L9.5445 11.2462L7.34775 16.5H3.75L7.5135 7.5H11.1112L14.07 12.957L16.6522 7.5H20.25L15.99 16.5Z" fill={color} /></Svg>;
}
export default nav;