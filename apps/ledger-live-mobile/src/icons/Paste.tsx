import { props } from "lodash/fp";
import * as React from "react";
import Svg, { Path } from "react-native-svg";

interface PasteProps {
  color: string;
}

export default function Paste({ color }: PasteProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.5 12.5h5m-5 2.5H15m-2.5 2.5H16M15 6V5c0-1.1-.9-2-2-2H5a2 2 0 00-2 2v8c0 1.11.89 2 2 2h1m3-4v8a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2z"
        stroke="#fff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
      />
    </Svg>
  );
}
