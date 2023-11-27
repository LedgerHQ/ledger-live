
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function ride({ size, color }: Props) {
  return <Svg width={size} height={size} id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" enableBackground="new 0 0 24 24" xmlSpace="preserve"><Path fill={color} d="M20,10.1V7.6h-2.3c-0.8-1.7-2.5-2.8-4.6-2.8H6.8v2.8H4v2.3h2.8v1.5H4v2.3h2.8v5.4h3.1v-5.2h2.3l3.1,5.2h3.4 l-3.2-5.4H20v-2.3h-2.5c0.3-0.5,0.3-1.1,0.5-1.5h2V10.1z M12.9,11.5H9.7V7.6h3.2c1.2,0,2,0.8,2,1.8C14.9,10.7,14.2,11.5,12.9,11.5z" /></Svg>;
}
export default ride;