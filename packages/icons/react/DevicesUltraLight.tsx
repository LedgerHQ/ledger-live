import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DevicesUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.76 21.36h6.864v-.816H5.808c-.6 0-1.008-.408-1.008-1.008V4.44c0-.6.408-.984 1.008-.984h9.624c.6 0 1.008.384 1.008.984v2.544h.84V4.44c0-.984-.816-1.8-1.8-1.8H5.76c-.984 0-1.8.816-1.8 1.8v15.12c0 .984.816 1.8 1.8 1.8zm8.64 0h5.64V8.76H14.4v12.6zm.816-.816V9.576h4.008v10.968h-4.008z"  /></Svg>;
}

export default DevicesUltraLight;