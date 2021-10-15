import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DevicesRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.52 21.36h6.696v-1.464H5.64c-.216 0-.36-.168-.36-.384V4.464c0-.216.144-.36.36-.36h9.96c.216 0 .36.144.36.36v2.112h1.56V4.44c0-.984-.816-1.8-1.8-1.8H5.52c-.984 0-1.8.816-1.8 1.8v15.12c0 .984.816 1.8 1.8 1.8zm8.64 0h6.12V8.52h-6.12v12.84zm1.464-1.464V9.984h3.192v9.912h-3.192z"  /></Svg>;
}

export default DevicesRegular;