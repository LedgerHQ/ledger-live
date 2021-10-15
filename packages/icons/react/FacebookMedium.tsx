import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FacebookMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.536 21.3v-6.528h-2.4V12.06h2.4V9.972c0-2.256 1.392-3.624 3.552-3.624.672 0 1.344.072 2.064.192v2.304h-1.176c-1.008 0-1.488.456-1.488 1.44v1.776h2.616l-.456 2.712h-2.16V21.3c4.488-.696 7.872-4.608 7.872-9.24A9.326 9.326 0 0012 2.7a9.311 9.311 0 00-9.36 9.36c0 4.632 3.432 8.544 7.896 9.24z"  /></Svg>;
}

export default FacebookMedium;