import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#32a4be";
function ONT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M18.75 18.163L7.483 7.14a6.65 6.65 0 014.667-1.89c3.645 0 6.6 2.89 6.6 6.457zM5.25 5.837L16.517 16.86a6.65 6.65 0 01-4.667 1.89c-3.645 0-6.6-2.89-6.6-6.456z" clipRule="evenodd" /></Svg>;
}
ONT.DefaultColor = DefaultColor;
export default ONT;