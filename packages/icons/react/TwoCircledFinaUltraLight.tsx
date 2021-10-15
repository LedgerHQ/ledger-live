import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledFinaUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.028 16.464h6v-.768H8.94v-.432l2.88-2.04c1.584-1.128 2.136-1.992 2.136-3.12 0-1.8-1.392-2.76-3.024-2.76-1.92 0-3.096 1.344-3.096 2.88v.24h.816v-.24c0-1.2.72-2.112 2.256-2.112h.072c1.272 0 2.136.648 2.136 1.992 0 .888-.36 1.512-1.944 2.664L8.028 15v1.464zM4.068 21h6.864c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9H4.068v.84h6.864c4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16H4.068V21z"  /></Svg>;
}

export default TwoCircledFinaUltraLight;