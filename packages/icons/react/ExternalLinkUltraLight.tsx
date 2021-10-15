import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ExternalLinkUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 21l16.08-.024V12h-.84v8.136l-14.4.024V5.76H12v-.84H3V21zm7.896-8.472l.576.576 8.76-8.76v4.824H21V3h-6.144v.768h4.776l-8.736 8.76z"  /></Svg>;
}

export default ExternalLinkUltraLight;