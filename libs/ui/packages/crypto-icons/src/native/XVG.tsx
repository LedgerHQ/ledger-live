import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00CBFF";

function XVG({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M7.207 7.001L6 4.5h12l-1.194 2.501H18L11.963 19.5 6 7.001h1.207zm0 0L12.037 17 16.806 7H7.208z"  /><Path opacity={0.504} d="M12 17.625L6 4.5h12l-6 13.125z"  /></Svg>;
}

XVG.DefaultColor = DefaultColor;
export default XVG;