import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CrownMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 16.44h18.72V4.512l-5.496 4.176L12 3.84 8.136 8.688 2.64 4.512V16.44zm0 3.72h18.72v-1.8H2.64v1.8zm1.872-5.52V8.232l3.96 3L12 6.792l3.528 4.44 3.96-3v6.408H4.512z"  /></Svg>;
}

export default CrownMedium;