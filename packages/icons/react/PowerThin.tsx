import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PowerThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.32 22.32l8.616-12.48h-6.408l1.152-8.16-8.616 12.48h6.408l-1.152 8.16zm-4.344-8.64L12.912 3.6 12 10.32h6.024L11.088 20.4 12 13.68H5.976z"  /></Svg>;
}

export default PowerThin;