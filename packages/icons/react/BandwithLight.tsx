import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BandwithLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.704 20.4h1.272V3.6h-1.272v16.8zm-16.68 0h1.272v-4.248H3.024V20.4zm4.176 0h1.248v-7.392H7.2V20.4zm4.176 0h1.248V9.864h-1.248V20.4zm4.176 0H16.8V6.72h-1.248V20.4z"  /></Svg>;
}

export default BandwithLight;