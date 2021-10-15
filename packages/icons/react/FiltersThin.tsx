import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiltersThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.64 21.36v-5.328h3v-.48H2.16v.48h3v5.328h.48zm-.48-7.728h.48V2.64h-.48v10.992zM8.76 8.4h6.48v-.48h-3V2.64h-.48v5.28h-3v.48zm3 12.96h.48V10.32h-.48v11.04zm3.6-5.328h3v5.328h.48v-5.328h3v-.48h-6.48v.48zm3-2.4h.48V2.64h-.48v10.992z"  /></Svg>;
}

export default FiltersThin;