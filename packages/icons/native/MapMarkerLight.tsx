import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MapMarkerLight({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M7.86 16.344l4.128 5.544 4.128-5.544c1.68-2.256 3.048-4.512 3.048-6.96-.048-4.488-3.48-7.272-7.176-7.272S4.86 4.896 4.836 9.384c0 2.448 1.344 4.704 3.024 6.96zm-1.824-6.96c.024-3.792 2.88-6.072 5.952-6.072 3.096 0 5.952 2.28 5.976 6.072 0 2.064-1.2 4.08-2.808 6.24l-3.168 4.248-3.144-4.248c-1.632-2.16-2.808-4.176-2.808-6.24zm2.592-.072a3.37 3.37 0 003.36 3.36 3.354 3.354 0 003.36-3.36 3.34 3.34 0 00-3.36-3.36 3.354 3.354 0 00-3.36 3.36zm1.08 0a2.279 2.279 0 012.28-2.28 2.264 2.264 0 012.28 2.28 2.279 2.279 0 01-2.28 2.28 2.294 2.294 0 01-2.28-2.28z"  /></Svg>;
}

export default MapMarkerLight;