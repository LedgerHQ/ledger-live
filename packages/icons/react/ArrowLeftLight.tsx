import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowLeftLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.276 18.624l.768-.768-3.288-3.264a165.464 165.464 0 00-2.064-2.016h16.68v-1.152H4.692c.696-.672 1.392-1.368 2.064-2.04l3.288-3.264-.768-.744L2.628 12l6.648 6.624z"  /></Svg>;
}

export default ArrowLeftLight;