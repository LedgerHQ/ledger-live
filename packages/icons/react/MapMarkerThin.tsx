import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MapMarkerThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.28 16.392L12 21.408l3.72-5.016c1.728-2.328 3.072-4.56 3.072-6.888-.024-4.296-3.288-6.912-6.792-6.912S5.232 5.208 5.208 9.504c0 2.328 1.344 4.56 3.072 6.888zM5.688 9.504C5.712 5.496 8.736 3.072 12 3.072c3.264 0 6.288 2.424 6.312 6.432 0 2.184-1.272 4.296-2.976 6.6L12 20.592l-3.336-4.488c-1.704-2.304-2.976-4.416-2.976-6.6zm3.192-.072a3.114 3.114 0 003.12 3.12 3.114 3.114 0 003.12-3.12A3.114 3.114 0 0012 6.312a3.114 3.114 0 00-3.12 3.12zm.48 0A2.632 2.632 0 0112 6.792a2.632 2.632 0 012.64 2.64 2.632 2.632 0 01-2.64 2.64 2.632 2.632 0 01-2.64-2.64z"  /></Svg>;
}

export default MapMarkerThin;