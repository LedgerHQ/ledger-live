import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BringFrontUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.84 21H21v-8.16h-2.64v.816h1.824v6.528h-6.528V18.36h-.816V21zM3 11.16h2.64v-.816H3.816V3.816h6.888V5.64h.816V3H3v8.16zm4.92 4.92h8.16V7.92H7.92v8.16zm.816-.816V8.736h6.528v6.528H8.736z"  /></Svg>;
}

export default BringFrontUltraLight;