import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#32A4BE";

function ONT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path fillRule="evenodd" clipRule="evenodd" d="M18.75 18.163L7.483 7.14A6.653 6.653 0 0112.15 5.25c3.645 0 6.6 2.89 6.6 6.457v6.456zM5.25 5.837L16.517 16.86a6.653 6.653 0 01-4.667 1.89c-3.645 0-6.6-2.89-6.6-6.456V5.837z"  /></Svg>;
}

ONT.DefaultColor = DefaultColor;
export default ONT;