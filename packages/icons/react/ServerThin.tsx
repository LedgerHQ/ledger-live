import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ServerThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 21.36h7.2V14.4H6.936v-2.16h10.128v2.16H13.68v6.96h7.2V14.4h-3.336v-2.64H12.24V9.6h3.36V2.64H8.4V9.6h3.36v2.16H6.456v2.64H3.12v6.96zm.48-.48v-6h6.24v6H3.6zM8.88 9.12v-6h6.24v6H8.88zm5.28 11.76v-6h6.24v6h-6.24z"  /></Svg>;
}

export default ServerThin;