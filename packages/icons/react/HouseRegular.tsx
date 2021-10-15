import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HouseRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.32 21.36h6.576v-6.864h2.208v6.864h6.576v-9.72l1.584 1.44L22.32 12 12 2.64 1.68 12l1.056 1.08 1.584-1.44v9.72zm1.512-1.464v-9.624L12 4.68l6.168 5.592v9.624h-3.672v-6.792H9.504v6.792H5.832z"  /></Svg>;
}

export default HouseRegular;