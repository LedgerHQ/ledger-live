import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#080D98";

function STORM({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path fillRule="evenodd" clipRule="evenodd" d="M17.25 4.5l-9.022 6.188 4.557 2.906L6.75 19.5l9.977-6.906-4.496-2.906L17.25 4.5z"  /></Svg>;
}

STORM.DefaultColor = DefaultColor;
export default STORM;