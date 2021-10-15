import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChevronRightUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.356 20.112l.576.576L16.644 12 7.932 3.312l-.576.576L15.444 12l-8.088 8.112z"  /></Svg>;
}

export default ChevronRightUltraLight;