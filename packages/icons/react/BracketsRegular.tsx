import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BracketsRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.56 10.2h1.56V2.88H13.8v1.56h5.76v5.76zM2.88 21.096h7.32v-1.56H4.44v-5.76H2.88v7.32zm0-10.896h1.56V4.44h5.76V2.88H2.88v7.32zM13.8 21.12h7.32V13.8h-1.56v5.76H13.8v1.56z"  /></Svg>;
}

export default BracketsRegular;