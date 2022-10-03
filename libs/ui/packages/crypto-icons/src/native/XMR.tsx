import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#F60";

function XMR({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 3.893a8.112 8.112 0 017.7 10.692h-2.42v-6.82L12 13.045l-5.28-5.28v6.82H4.3a8.302 8.302 0 01-.418-2.574A8.112 8.112 0 0112 3.893zm-1.21 10.339l1.232 1.211 1.21-1.21 2.288-2.31v4.29h3.41A8.104 8.104 0 0112 20.107a8.13 8.13 0 01-6.93-3.894h3.41v-4.29l2.31 2.31v-.001z"  /></Svg>;
}

XMR.DefaultColor = DefaultColor;
export default XMR;