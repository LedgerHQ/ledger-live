import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BandwithRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.488 20.4h1.656V3.6h-1.656v16.8zm-16.632 0h1.656v-4.248H2.856V20.4zm4.152 0h1.656v-7.392H7.008V20.4zm4.176 0h1.632V9.864h-1.632V20.4zm4.152 0h1.656V6.72h-1.656V20.4z"  /></Svg>;
}

export default BandwithRegular;