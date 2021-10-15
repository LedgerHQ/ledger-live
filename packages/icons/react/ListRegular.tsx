import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ListRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.26 7.248H21.3v-1.56H7.26v1.56zM2.7 18.6h2.16v-2.16H2.7v2.16zm0-5.52h2.16v-2.16H2.7v2.16zm0-5.52h2.16V5.4H2.7v2.16zm4.56 10.728H21.3v-1.56H7.26v1.56zm0-5.52H21.3v-1.56H7.26v1.56z"  /></Svg>;
}

export default ListRegular;