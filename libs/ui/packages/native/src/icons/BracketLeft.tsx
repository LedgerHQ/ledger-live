import React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const BracketLeft = (props: SvgProps): React.ReactElement => (
  <Svg viewBox="0 0 64 128" {...props}>
    <Path d="m 8.692,119.94 v 8.058 H 64 V 91.6548 H 55.941 V 119.94 Z" />
    <Path d="M 8.692,0 V 8.05844 H 55.941 V 36.3452 H 64 V 0 Z" />
  </Svg>
);

export default BracketLeft;
