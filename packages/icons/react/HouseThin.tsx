import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HouseThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.32 21.36h6.12v-7.32h3.12v7.32h6.12V10.248l2.328 2.112.312-.36L12 2.64 1.68 12l.312.36 2.328-2.112V21.36zm.48-.48V9.816L12 3.288l7.2 6.528V20.88h-5.16v-7.32H9.96v7.32H4.8z"  /></Svg>;
}

export default HouseThin;