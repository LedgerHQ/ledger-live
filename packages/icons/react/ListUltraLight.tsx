import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ListUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.9 6.888h14.28v-.84H6.9v.84zM2.82 18.36H4.5v-1.68H2.82v1.68zm0-5.52H4.5v-1.68H2.82v1.68zm0-5.52H4.5V5.64H2.82v1.68zM6.9 17.928h14.28v-.84H6.9v.84zm0-5.52h14.28v-.84H6.9v.84z"  /></Svg>;
}

export default ListUltraLight;