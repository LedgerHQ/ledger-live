import * as React from "react";
import Svg, { Path } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoImportThin({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.64 8.64h18.72V2.88H2.64v5.76zm.48-.48v-4.8h8.496a2.93 2.93 0 00-1.296 2.376 3.019 3.019 0 001.296 2.424H3.12zm4.536 8.616L12 21.12l4.344-4.344-.336-.336-1.8 1.8-1.968 1.968V10.8h-.48v9.408L9.792 18.24l-1.8-1.8-.336.336zM10.8 5.736c.024-1.296 1.08-2.376 2.376-2.376h7.704v4.8h-7.704c-1.296 0-2.352-1.08-2.376-2.424zm1.008.024c0 .792.648 1.44 1.44 1.44.792 0 1.44-.648 1.44-1.44 0-.792-.648-1.44-1.44-1.44-.792 0-1.44.648-1.44 1.44zm.48 0c0-.528.432-.96.96-.96s.96.432.96.96-.432.96-.96.96a.963.963 0 01-.96-.96z"
        fill={color}
      />
    </Svg>
  );
}

export default NanoImportThin;
