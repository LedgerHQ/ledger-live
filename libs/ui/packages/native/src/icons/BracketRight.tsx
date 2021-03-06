import React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

const BracketRight = (props: SvgProps): React.ReactElement => (
  <Svg viewBox="0 0 64 128" {...props}>
    <Path d="M 0,91.6548 V 128 h 55.3076 v -8.06 H 8.05844 V 91.6548 Z" />
    <Path d="M 0,0 V 36.3452 H 8.05844 V 8.05844 H 55.3076 V 0 Z" />
  </Svg>
);

export default BracketRight;
