import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PenMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.848 22.152l7.2-1.968L22.152 7.08 16.92 1.848 3.816 14.952l-1.968 7.2zm2.568-2.568l1.008-3.696 2.688 2.688-3.696 1.008zm2.28-4.968L14.112 7.2 16.8 9.888l-7.416 7.416-2.688-2.688zm8.688-8.688l1.536-1.536 2.688 2.688-1.536 1.536-2.688-2.688z"  /></Svg>;
}

export default PenMedium;