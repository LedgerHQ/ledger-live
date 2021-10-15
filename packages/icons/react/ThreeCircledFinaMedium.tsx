import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ThreeCircledFinaMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.44 16.68c2.016 0 3.528-1.176 3.528-2.712A2.03 2.03 0 0012.528 12v-.336c.648-.264 1.128-.936 1.128-1.752 0-1.44-1.44-2.592-3.216-2.592-1.896 0-3.36 1.248-3.36 2.808v.168h1.896c0-1.056.24-1.296 1.44-1.296 1.128 0 1.368.216 1.368 1.104 0 .912-.192 1.008-1.152 1.008H9.6v1.68h1.056c1.08 0 1.344.192 1.344 1.104 0 .912-.288 1.104-1.584 1.104s-1.536-.216-1.536-1.44H6.936v.12c0 1.728 1.464 3 3.504 3zM4.2 21.36h6.24c5.256 0 9.36-4.272 9.36-9.36 0-5.232-4.128-9.36-9.36-9.36H4.2v1.92h6.24c4.176 0 7.44 3.264 7.44 7.44 0 4.056-3.264 7.44-7.44 7.44H4.2v1.92z"  /></Svg>;
}

export default ThreeCircledFinaMedium;