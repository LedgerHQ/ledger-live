import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ThreeCircledMediMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 16.68c2.016 0 3.528-1.176 3.528-2.712A2.03 2.03 0 0014.088 12v-.336c.648-.264 1.128-.936 1.128-1.752 0-1.44-1.44-2.592-3.216-2.592-1.896 0-3.36 1.248-3.36 2.808v.168h1.896c0-1.056.24-1.296 1.44-1.296 1.128 0 1.368.216 1.368 1.104 0 .912-.192 1.008-1.152 1.008H11.16v1.68h1.056c1.08 0 1.344.192 1.344 1.104 0 .912-.288 1.104-1.584 1.104s-1.536-.216-1.536-1.44H8.496v.12c0 1.728 1.464 3 3.504 3zm-6.24 4.68h12.48v-1.92H5.76v1.92zm0-16.8h12.48V2.64H5.76v1.92z"  /></Svg>;
}

export default ThreeCircledMediMedium;