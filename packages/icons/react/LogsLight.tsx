import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LogsLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.76 13.08h18.48v-1.2H2.76v1.2zm0 5.52h13.68v-1.2H2.76v1.2zm0-10.104L5.256 6.96 2.76 5.4v3.096zm4.68-.936h13.8v-1.2H7.44v1.2z"  /></Svg>;
}

export default LogsLight;