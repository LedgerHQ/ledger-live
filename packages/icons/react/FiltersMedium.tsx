import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiltersMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.192 21.36v-3.888H8.16v-1.92h-6v1.92h1.992v3.888h2.04zm-2.04-7.728h2.04V2.64h-2.04v10.992zM9 8.4h6V6.48h-1.968V2.64h-2.04v3.84H9V8.4zm1.992 12.96h2.04V10.32h-2.04v11.04zm4.848-3.888h1.992v3.888h2.04v-3.888h1.968v-1.92h-6v1.92zm1.992-3.84h2.04V2.64h-2.04v10.992z"  /></Svg>;
}

export default FiltersMedium;