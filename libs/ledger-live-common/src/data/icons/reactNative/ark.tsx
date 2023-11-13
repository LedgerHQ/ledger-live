
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function ark({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M11.9602 10.0103L3.75 18.6675L11.997 5.25L20.25 18.75L11.9602 10.0103ZM13.1512 13.449H10.5848L11.9047 11.997L13.1512 13.4618V13.449ZM8.20125 15.8317V15.8137L9.657 14.3235V14.3168L14.097 14.298L15.5955 15.8317H8.202H8.20125Z" fill={color} /></Svg>;
}
export default ark;