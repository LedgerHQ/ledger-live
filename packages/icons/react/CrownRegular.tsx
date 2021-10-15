import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CrownRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.76 16.416h18.48V4.728l-5.4 4.08L12 3.984 8.16 8.808l-5.4-4.08v11.688zm0 3.6h18.48v-1.464H2.76v1.464zm1.536-5.064v-7.2l4.128 3.144L12 6.408l3.576 4.488 4.152-3.144v7.2H4.296z"  /></Svg>;
}

export default CrownRegular;