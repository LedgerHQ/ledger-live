import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number;
  color: string;
};
export default function ExternalLink({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M11.25 8.667a.75.75 0 1 1 1.5 0v4c0 1.15-.933 2.083-2.083 2.083H3.333a2.083 2.083 0 0 1-2.083-2.083V5.333c0-1.15.933-2.083 2.083-2.083h4a.75.75 0 1 1 0 1.5h-4a.583.583 0 0 0-.583.583v7.334c0 .322.261.583.583.583h7.334a.583.583 0 0 0 .583-.583v-4zm2-5.917H10a.75.75 0 0 1 0-1.5h4a.75.75 0 0 1 .75.75v4a.75.75 0 1 1-1.5 0V2.75zM7.197 9.864a.75.75 0 0 1-1.06-1.061L13.47 1.47a.75.75 0 0 1 1.06 1.06L7.197 9.864z"
      />
    </Svg>
  );
}
