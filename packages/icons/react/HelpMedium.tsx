import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HelpMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.016 13.536H12c2.688 0 3.864-1.776 3.864-3.576 0-1.848-1.272-3.744-3.696-3.744-2.136 0-3.72 1.728-3.72 3.48v.192h1.92v-.456c0-1.08.432-1.416 1.632-1.416h.288c1.224 0 1.656.336 1.656 1.416v1.272c0 .912-.336 1.152-1.512 1.152h-1.416v1.68zM2.64 12c0 5.232 4.128 9.36 9.36 9.36 5.256 0 9.36-4.272 9.36-9.36 0-5.232-4.128-9.36-9.36-9.36-5.232 0-9.36 4.128-9.36 9.36zm1.92 0c0-4.176 3.264-7.44 7.44-7.44s7.44 3.264 7.44 7.44c0 4.056-3.264 7.44-7.44 7.44S4.56 16.176 4.56 12zm6.288 5.28h2.304v-2.304h-2.304v2.304z"  /></Svg>;
}

export default HelpMedium;