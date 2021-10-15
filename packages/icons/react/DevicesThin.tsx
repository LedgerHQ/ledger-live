import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DevicesThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.88 21.36h6.96v-.48H5.88c-.792 0-1.32-.528-1.32-1.32V4.44c0-.792.528-1.32 1.32-1.32h9.48c.792 0 1.32.528 1.32 1.32V7.2h.48V4.44c0-.984-.816-1.8-1.8-1.8H5.88c-.984 0-1.8.816-1.8 1.8v15.12c0 .984.816 1.8 1.8 1.8zm8.64 0h5.4V8.88h-5.4v12.48zm.48-.48V9.36h4.44v11.52H15z"  /></Svg>;
}

export default DevicesThin;