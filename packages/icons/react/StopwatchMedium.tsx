import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StopwatchMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 22.08c4.56 0 8.28-3.72 8.28-8.28 0-1.92-.648-3.672-1.752-5.088L19.68 7.56l-1.44-1.44-1.152 1.152a8.43 8.43 0 00-4.128-1.704V3.84h1.8V1.92H9.24v1.92h1.8v1.728c-4.104.48-7.32 4.008-7.32 8.232 0 4.56 3.72 8.28 8.28 8.28zM5.64 13.8c0-3.504 2.856-6.36 6.36-6.36 3.504 0 6.36 2.856 6.36 6.36 0 3.504-2.856 6.36-6.36 6.36-3.504 0-6.36-2.856-6.36-6.36zm5.4.48c0 .528.432.96.96.96s.96-.432.96-.96V9.12h-1.92v5.16z"  /></Svg>;
}

export default StopwatchMedium;