import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerFastRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.068 20.124h15.84c1.32-1.68 2.16-3.84 2.16-6.168A9.76 9.76 0 0020.556 8.7l-1.128 1.152a8.434 8.434 0 011.08 4.104 8.406 8.406 0 01-1.392 4.608H4.86a8.388 8.388 0 01-1.368-4.608c0-4.704 3.816-8.52 8.496-8.52 1.488 0 2.904.408 4.104 1.08l1.152-1.128a9.76 9.76 0 00-5.256-1.512c-5.544 0-10.056 4.536-10.056 10.08 0 2.328.816 4.488 2.136 6.168zm7.152-6.168c0 .432.336.768.768.768a.76.76 0 00.552-.216l7.128-7.152-1.08-1.08-7.152 7.128a.76.76 0 00-.216.552z"  /></Svg>;
}

export default TachometerFastRegular;