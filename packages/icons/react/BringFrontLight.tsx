import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BringFrontLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.72 21.12h8.4v-8.4h-2.76v1.128h1.632v6.12h-6.12V18.36H12.72v2.76zm-9.84-9.84h2.76v-1.152H4.032v-6.12h6.36V5.64h1.128V2.88H2.88v8.4zM7.8 16.2h8.4V7.8H7.8v8.4zm1.152-1.152v-6.12h6.12v6.12h-6.12z"  /></Svg>;
}

export default BringFrontLight;