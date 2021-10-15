import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoFirmwareUpdateThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 21.12h18.72v-5.76H2.64v5.76zm.48-.48v-4.8h8.496a2.93 2.93 0 00-1.296 2.376 3.018 3.018 0 001.296 2.424H3.12zM7.656 8.856L12 13.2l4.344-4.344-.336-.336-1.8 1.8-1.968 1.968V2.88h-.48v9.408L9.792 10.32l-1.8-1.8-.336.336zm3.144 9.36c.024-1.296 1.08-2.376 2.376-2.376h7.704v4.8h-7.704c-1.296 0-2.352-1.08-2.376-2.424zm1.008.024c0 .792.648 1.44 1.44 1.44.792 0 1.44-.648 1.44-1.44 0-.792-.648-1.44-1.44-1.44-.792 0-1.44.648-1.44 1.44zm.48 0c0-.528.432-.96.96-.96s.96.432.96.96-.432.96-.96.96a.963.963 0 01-.96-.96z"  /></Svg>;
}

export default NanoFirmwareUpdateThin;