import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function QuitMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.36 21.84h12.48V2.16H9.36v5.52h1.92v-3.6h8.64v15.84h-8.64v-3.6H9.36v5.52zM2.16 12l4.344 4.344 1.176-1.2-1.056-1.056a29.775 29.775 0 00-1.248-1.176H15.6v-1.824H5.328c.456-.408.888-.792 1.296-1.2l1.056-1.08-1.176-1.176L2.16 12z"  /></Svg>;
}

export default QuitMedium;