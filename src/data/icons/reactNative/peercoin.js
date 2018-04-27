//@flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string
};

export default function Peercoin({ size, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M2.658 1.718v6.389c-.155 3.551 1.314 5.36 3.977 6.004 1.689.409 4.176.22 4.441.081a4.983 4.983 0 0 0 2.056-2.596c1.879-4.83-2.202-9.316-10.474-9.878zM1.863.029c9.85.338 15.22 5.952 12.815 12.132-.482 1.404-1.441 2.609-2.773 3.452-.704.376-3.6.596-5.657.098-3.404-.824-5.425-3.312-5.236-7.64V0l.851.03zm9.145 14.65l-1.563-.514c.98-2.987-.393-6.523-3.655-7.7l.559-1.548c4.161 1.501 5.901 5.98 4.66 9.762z"
      />
    </Svg>
  );
}
