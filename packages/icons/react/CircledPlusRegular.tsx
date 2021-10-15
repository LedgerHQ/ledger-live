import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledPlusRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.184 16.896h1.632v-4.128h4.08v-1.56h-4.08V7.104h-1.632v4.104h-4.08v1.56h4.08v4.128zM2.76 12c0 5.16 4.08 9.24 9.24 9.24 5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12zm1.56 0c0-4.32 3.384-7.68 7.68-7.68 4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68-4.296 0-7.68-3.384-7.68-7.68z"  /></Svg>;
}

export default CircledPlusRegular;