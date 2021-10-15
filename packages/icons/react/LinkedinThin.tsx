import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LinkedinThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.96 21.36h16.08c.744 0 1.32-.6 1.32-1.32V3.96c0-.72-.576-1.32-1.32-1.32H3.96c-.72 0-1.32.6-1.32 1.32v16.08c0 .72.6 1.32 1.32 1.32zM5.304 6.912a1.608 1.608 0 113.216 0 1.608 1.608 0 01-3.216 0zm.216 11.784V9.744h2.808v8.952H5.52zm4.536 0V9.744h2.664v1.2h.024c.432-.792 1.392-1.416 2.664-1.416 2.4 0 3.288 1.584 3.288 4.272v4.896h-2.76v-4.368c0-1.2-.072-2.376-1.464-2.376-1.272 0-1.632.936-1.632 2.304v4.44h-2.784z"  /></Svg>;
}

export default LinkedinThin;