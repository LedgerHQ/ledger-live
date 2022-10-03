import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#374851";

function TZC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M13.275 11.55v5.698c.153-.038.303-.08.45-.13v2.183a7.521 7.521 0 01-3 .09V11.55H8.1v-2.1h7.8v2.1h-2.625zm1.05 7.582v-2.258a5.4 5.4 0 10-4.65 0v2.258a7.5 7.5 0 114.65 0z"  /></Svg>;
}

TZC.DefaultColor = DefaultColor;
export default TZC;