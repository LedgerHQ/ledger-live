import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BringFrontMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.48 21.36h8.88v-8.88h-3v1.8h1.2v5.28h-5.28v-1.2h-1.8v3zm-9.84-9.84h3v-1.8h-1.2V4.44h5.28v1.2h1.8v-3H2.64v8.88zm4.92 4.92h8.88V7.56H7.56v8.88zm1.8-1.8V9.36h5.28v5.28H9.36z"  /></Svg>;
}

export default BringFrontMedium;