
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function nio({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M12 11.448H8.3835L12 5.25L15.6165 11.448H12ZM12.4913 18.75L14.3775 15.5182L16.1857 12.42L19.875 18.75H12.4913ZM9.6225 15.5182L11.5087 18.75H4.125L7.81425 12.42L9.62175 15.5182H9.6225Z" fill={color} /></Svg>;
}
export default nio;