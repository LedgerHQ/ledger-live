import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CrownThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 16.32h17.76V5.328l-5.112 3.84L12 4.44 8.232 9.168 3.12 5.328V16.32zm0 3.24h17.76v-.48H3.12v.48zm.48-3.72V6.288L8.304 9.84 12 5.208l3.696 4.632L20.4 6.288v9.552H3.6z"  /></Svg>;
}

export default CrownThin;