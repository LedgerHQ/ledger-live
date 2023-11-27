
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function bat({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M4.5 18.375L12.0383 5.625L19.5 18.3577L4.5 18.375ZM12.0203 10.785L8.93925 15.8745H15.1155L12.0203 10.785Z" fill={color} /></Svg>;
}
export default bat;