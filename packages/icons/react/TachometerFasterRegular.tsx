import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerFasterRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.068 20.124H19.86c.84-.936 1.584-2.424 1.92-3.84h-1.632c-.24.816-.6 1.608-1.032 2.28H4.86a8.388 8.388 0 01-1.368-4.608c0-4.704 3.816-8.52 8.496-8.52 3.888 0 7.152 2.616 8.16 6.168h1.632c-1.056-4.416-5.04-7.728-9.792-7.728-5.544 0-10.056 4.536-10.056 10.08 0 2.328.816 4.488 2.136 6.168zm7.152-6.168c0 .432.336.768.768.768h10.08v-1.56h-10.08a.779.779 0 00-.768.792z"  /></Svg>;
}

export default TachometerFasterRegular;