import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BracketsMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.44 10.2h1.92V2.64H13.8v1.92h5.64v5.64zM2.64 21.336h7.56v-1.92H4.56v-5.64H2.64v7.56zm0-11.136h1.92V4.56h5.64V2.64H2.64v7.56zM13.8 21.36h7.56V13.8h-1.92v5.64H13.8v1.92z"  /></Svg>;
}

export default BracketsMedium;