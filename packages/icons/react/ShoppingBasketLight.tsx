import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShoppingBasketLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.84 20.772h16.32V9.252H16.8V8.076c0-1.272-.288-2.232-.888-3C15 3.9 13.536 3.228 12 3.228c-1.512 0-3 .672-3.888 1.848-.6.768-.912 1.752-.912 3v1.176H3.84v11.52zm1.2-1.152v-9.24H7.2v2.592h1.2V10.38h7.2v2.592h1.2V10.38h2.16v9.24H5.04zM8.4 9.252v-1.68c0-1.944 1.248-3.168 3.264-3.168h.672c2.016 0 3.264 1.224 3.264 3.168v1.68H8.4z"  /></Svg>;
}

export default ShoppingBasketLight;