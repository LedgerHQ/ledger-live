import React from "react";
import { LinearGradient, Stop } from "react-native-svg";

type Props = {
  height: number;
  color: string;
};

const DefGraph = ({ height, color }: Props) => {
  return (
    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
      <Stop offset="0" stopColor={color} stopOpacity="0.3" />
      <Stop offset="1" stopColor={color} stopOpacity="0" />
    </LinearGradient>
  );
};

export default DefGraph;
