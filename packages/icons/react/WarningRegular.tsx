import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WarningRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.944 21.12h20.112L12 2.88 1.944 21.12zm2.568-1.464L12 6.072l7.488 13.584H4.512zm6.456-1.416h2.04V16.2h-2.04v2.04zm.24-6.024l.168 2.544h1.248l.168-2.544v-2.088h-1.584v2.088z"  /></Svg>;
}

export default WarningRegular;