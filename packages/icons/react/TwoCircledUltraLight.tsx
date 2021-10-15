import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9s-9 3.96-9 9 3.96 9 9 9zm-8.16-9c0-4.584 3.6-8.16 8.16-8.16 4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16-4.56 0-8.16-3.6-8.16-8.16zm5.064-1.536h.816v-.24c0-1.2.72-2.112 2.256-2.112h.072c1.272 0 2.136.648 2.136 1.992 0 .888-.36 1.536-1.944 2.664L9.096 15v1.464h6v-.768h-5.088v-.432l2.856-2.04c1.608-1.152 2.16-2.016 2.16-3.12 0-1.8-1.392-2.76-3.024-2.76-1.92 0-3.096 1.344-3.096 2.88v.24z"  /></Svg>;
}

export default TwoCircledUltraLight;