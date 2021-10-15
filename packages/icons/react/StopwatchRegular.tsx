import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StopwatchRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.9c4.488 0 8.16-3.672 8.16-8.16a8.05 8.05 0 00-1.848-5.136l1.224-1.248-1.152-1.152-1.248 1.224a7.829 7.829 0 00-4.344-1.8V3.66h1.848V2.1H9.36v1.56h1.872v1.968C7.104 6.012 3.84 9.516 3.84 13.74c0 4.488 3.672 8.16 8.16 8.16zm-6.6-8.16c0-3.648 2.976-6.6 6.6-6.6 3.648 0 6.6 2.952 6.6 6.6 0 3.624-2.952 6.6-6.6 6.6-3.624 0-6.6-2.976-6.6-6.6zm5.832.48c0 .432.336.768.768.768a.779.779 0 00.792-.768V8.868h-1.56v5.352z"  /></Svg>;
}

export default StopwatchRegular;