import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ExternalLinkThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 20.88l15.84-.024V12h-.48v8.376L3.6 20.4V5.52H12v-.48H3.12v15.84zm7.896-8.232l.336.336L20.4 3.936v5.352h.48V3.12h-6.144v.48h5.304l-9.024 9.048z"  /></Svg>;
}

export default ExternalLinkThin;