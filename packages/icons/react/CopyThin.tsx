import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CopyThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.04 15.12h3.84v-12l-12 .024V6.96h.48V3.624L20.4 3.6v11.04h-3.36v.48zM3.12 20.88h12v-12h-12v12zm.48-.48V9.36h11.04V20.4H3.6z"  /></Svg>;
}

export default CopyThin;