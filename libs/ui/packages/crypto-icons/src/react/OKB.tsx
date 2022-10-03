import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#2D60E0";

function OKB({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path opacity={0.15} d="M12 11.245A3.623 3.623 0 1012 4a3.623 3.623 0 000 7.245z"  /><path opacity={0.4} d="M16.378 15.623a3.623 3.623 0 100-7.246 3.623 3.623 0 000 7.246z"  /><path opacity={0.6} d="M12 20a3.623 3.623 0 100-7.245A3.623 3.623 0 0012 20z"  /><path opacity={0.85} d="M7.623 15.623a3.623 3.623 0 100-7.246 3.623 3.623 0 000 7.246z"  /></Svg>;
}

OKB.DefaultColor = DefaultColor;
export default OKB;