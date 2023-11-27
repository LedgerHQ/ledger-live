
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function mtl({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M6 6.75H6.75V17.25H6V6.75ZM9.75 9H10.5V15.75H9.75V9ZM13.5 10.5H14.25V14.25H13.5V10.5ZM17.25 6.75H18V17.25H17.25V6.75Z" fill={color} /></Svg>;
}
export default mtl;