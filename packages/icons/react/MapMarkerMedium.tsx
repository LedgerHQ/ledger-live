import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MapMarkerMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.488 16.32L12 22.368l4.512-6.048c1.656-2.184 3.024-4.488 3.024-7.032C19.512 4.56 15.888 1.632 12 1.632c-3.888 0-7.512 2.928-7.536 7.656 0 2.544 1.368 4.848 3.024 7.032zM6.384 9.288C6.408 5.712 9.096 3.552 12 3.552c2.904 0 5.592 2.16 5.616 5.736 0 1.944-1.104 3.84-2.64 5.88L12 19.152l-2.976-3.984c-1.536-2.04-2.64-3.936-2.64-5.88zM8.4 9.192c0 1.992 1.608 3.6 3.6 3.6s3.6-1.608 3.6-3.6-1.608-3.6-3.6-3.6a3.595 3.595 0 00-3.6 3.6zm1.68 0c0-1.056.864-1.92 1.92-1.92s1.92.864 1.92 1.92-.864 1.92-1.92 1.92a1.926 1.926 0 01-1.92-1.92z"  /></Svg>;
}

export default MapMarkerMedium;