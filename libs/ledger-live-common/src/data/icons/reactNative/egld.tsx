
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function egld({ size, color }: Props) {
  return <Svg width={size} height={size} id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xmlSpace="preserve"><Path fill={color} d="M12.9,12l7.1-3.8l-1.2-2.3l-6.5,2.6c-0.2,0.1-0.4,0.1-0.5,0L5.2,5.9L4.1,8.2l7.1,3.8l-7.1,3.8l1.2,2.3l6.5-2.6 c0.2-0.1,0.4-0.1,0.5,0l6.5,2.6l1.2-2.3L12.9,12z" /></Svg>;
}
export default egld;