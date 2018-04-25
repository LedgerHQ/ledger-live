//@flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string
};

export default function Decred({ size, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M1.998 2.154L3.112 1l5.85 5.646H5.275c-2.184 0-3.672 1.37-3.672 3.584v.128c0 2.21 1.484 3.572 3.672 3.572h3.349v1.603h-3.35C2.232 15.533 0 13.487 0 10.358v-.128c0-3.034 2.099-5.06 4.998-5.182l-3-2.894zm12.01 12.329l-1.116 1.15-5.84-5.665h3.673c2.188 0 3.672-1.368 3.672-3.584v-.128c0-2.216-1.484-3.584-3.672-3.584H7.376V1.068h3.35C13.77 1.068 16 3.124 16 6.256v.128c0 3.036-2.096 5.062-4.999 5.182l3.007 2.917z"
      />
    </Svg>
  );
}
