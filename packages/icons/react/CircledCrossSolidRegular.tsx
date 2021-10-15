import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledCrossSolidRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.24c5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12s4.08 9.24 9.24 9.24zm-4.68-5.664L10.896 12 7.32 8.424 8.424 7.32 12 10.896l3.576-3.576 1.104 1.104L13.104 12l3.576 3.576-1.104 1.104L12 13.104 8.424 16.68 7.32 15.576z"  /></Svg>;
}

export default CircledCrossSolidRegular;