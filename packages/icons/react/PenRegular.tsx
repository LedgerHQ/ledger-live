import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PenRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.04 21.96l6.696-1.848 13.224-13.2-4.872-4.872-13.2 13.224L2.04 21.96zm2.112-2.112l1.056-3.816 2.76 2.76-3.816 1.056zm2.088-4.872l8.088-8.088 2.784 2.784-8.088 8.088-2.784-2.784zm9.12-9.12l1.728-1.728 2.784 2.784-1.728 1.728-2.784-2.784z"  /></Svg>;
}

export default PenRegular;