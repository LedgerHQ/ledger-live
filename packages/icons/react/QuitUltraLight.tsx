import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function QuitUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.9 21.48h11.76V2.52H9.9v5.16h.84V3.36h10.08v17.28H10.74v-4.32H9.9v5.16zM2.34 12l4.344 4.344.552-.552-1.68-1.68a116.5 116.5 0 00-1.728-1.704H15.78v-.816H3.828c.576-.576 1.176-1.152 1.728-1.728l1.68-1.68-.552-.528L2.34 12z"  /></Svg>;
}

export default QuitUltraLight;