
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function salt({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 8.58375L16.353 17.7443H7.647L12 8.58375ZM12 4.5L4.875 19.5H19.125L12 4.5Z" fill={color} /></Svg>;
}
export default salt;