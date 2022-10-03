import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#3D58B0";

function RYO({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 3.011c-4.957 0-8.989 4.032-8.989 8.99 0 4.957 4.032 8.988 8.99 8.988 4.957 0 8.988-4.032 8.988-8.988 0-4.958-4.032-8.99-8.988-8.99zm0 1.224a7.756 7.756 0 017.765 7.766 7.754 7.754 0 01-7.764 7.764 7.755 7.755 0 01-7.766-7.764 7.756 7.756 0 017.766-7.766z"  /><Path d="M8.66 8.681v6.638h6.68V8.68H8.66zM9.749 9.77h4.503v4.462H9.75V9.77z"  /></Svg>;
}

RYO.DefaultColor = DefaultColor;
export default RYO;