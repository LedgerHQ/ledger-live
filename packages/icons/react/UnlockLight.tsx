import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UnlockLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.784 21.24H22.08V9.6h-9.744V7.896c0-2.832-2.376-5.136-5.208-5.136-2.832 0-5.208 2.304-5.208 5.136v3.384h1.2V7.896c0-2.184 1.8-4.008 4.008-4.008s4.008 1.824 4.008 4.008V9.6H8.784v11.64zm1.2-1.152v-9.36H20.88v9.36H9.984zm4.848-2.688h1.2v-4.08h-1.2v4.08z"  /></Svg>;
}

export default UnlockLight;