import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TpRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.228c5.088 0 9.24-4.128 9.24-9.216 0-5.088-4.152-9.24-9.24-9.24s-9.24 4.152-9.24 9.24 4.152 9.216 9.24 9.216zM5.544 9.372V8.076h6.432v1.296H9.48v7.056H8.088V9.372H5.544zm7.44 7.056V8.076h3.024c1.68 0 2.832 1.128 2.832 2.664 0 1.536-1.152 2.64-2.832 2.64H14.4v3.048h-1.416zm1.416-4.344h1.728c.888 0 1.248-.384 1.248-1.176v-.36c0-.816-.36-1.176-1.248-1.176H14.4v2.712z"  /></Svg>;
}

export default TpRegular;