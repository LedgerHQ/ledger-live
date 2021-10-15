import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DevicesMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.4 21.36H12v-1.8H5.568a.052.052 0 01-.048-.048V4.488c0-.024.024-.048.048-.048h10.104c.024 0 .048.024.048.048V6.36h1.92V4.44c0-.984-.816-1.8-1.8-1.8H5.4c-.984 0-1.8.816-1.8 1.8v15.12c0 .984.816 1.8 1.8 1.8zm8.64 0h6.36V8.4h-6.36v12.96zm1.8-1.8V10.2h2.76v9.36h-2.76z"  /></Svg>;
}

export default DevicesMedium;