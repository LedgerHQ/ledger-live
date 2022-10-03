import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#F60";

function XMO({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M21 12a9 9 0 01-9 9A9 9 0 014.771 6.635l1.47 1.47A6.916 6.916 0 005.046 12a6.952 6.952 0 006.947 6.947A6.953 6.953 0 0018.94 12a6.954 6.954 0 00-1.196-3.895l1.47-1.47A8.895 8.895 0 0121 12z"  /><Path d="M16.978 12A4.983 4.983 0 0112 16.978 4.983 4.983 0 017.021 12c0-.865.225-1.715.654-2.467L12 13.855l4.325-4.324c.428.752.654 1.603.654 2.469"  /><Path d="M17.885 5.194L12 11.072 7.514 6.593l-1.4-1.4A8.93 8.93 0 0112 3c2.25 0 4.303.823 5.885 2.194z"  /></Svg>;
}

XMO.DefaultColor = DefaultColor;
export default XMO;