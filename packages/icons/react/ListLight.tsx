import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ListLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.08 7.08h14.16v-1.2H7.08v1.2zm-4.32 11.4h1.92v-1.92H2.76v1.92zm0-5.52h1.92v-1.92H2.76v1.92zm0-5.52h1.92V5.52H2.76v1.92zm4.32 10.68h14.16v-1.2H7.08v1.2zm0-5.52h14.16v-1.2H7.08v1.2z"  /></Svg>;
}

export default ListLight;