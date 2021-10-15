import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LogsRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.7 13.308h18.6v-1.56H2.7v1.56zm0 5.52h13.8v-1.56H2.7v1.56zm0-9.96L5.676 7.02 2.7 5.172v3.696zm4.992-1.08H21.3v-1.56H7.692v1.56z"  /></Svg>;
}

export default LogsRegular;