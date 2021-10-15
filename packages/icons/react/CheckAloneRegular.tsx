import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CheckAloneRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.824 12.852l6.576 6.6L22.176 5.7l-1.152-1.152L8.4 17.1l-5.424-5.4-1.152 1.152z"  /></Svg>;
}

export default CheckAloneRegular;