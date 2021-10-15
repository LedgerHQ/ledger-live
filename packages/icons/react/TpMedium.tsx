import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TpMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.348c5.16 0 9.36-4.176 9.36-9.336s-4.2-9.36-9.36-9.36c-5.16 0-9.36 4.2-9.36 9.36 0 5.16 4.2 9.336 9.36 9.336zM5.52 9.66V8.076h6.432V9.66H9.6v6.768H7.896V9.66H5.52zm7.368 6.768V8.076h3.048c1.704 0 2.904 1.176 2.904 2.736 0 1.56-1.2 2.688-2.904 2.688h-1.32v2.928h-1.728zm1.728-4.488h1.464c.744 0 .96-.24.96-.912v-.456c0-.696-.216-.912-.96-.912h-1.464v2.28z"  /></Svg>;
}

export default TpMedium;