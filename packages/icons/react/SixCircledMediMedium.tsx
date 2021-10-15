import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SixCircledMediMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.952 16.704c1.968 0 3.312-1.32 3.312-3.096s-1.368-3.072-3-3.072c-.696 0-1.392.24-1.824.696h-.288C10.2 9.696 10.728 9 11.976 9c.864 0 1.416.288 1.512.984h1.752C15 8.376 13.776 7.344 12 7.344c-2.376 0-3.72 1.872-3.696 4.8.024 2.856 1.368 4.56 3.648 4.56zM5.76 21.36h12.48v-1.92H5.76v1.92zm0-16.8h12.48V2.64H5.76v1.92zm4.632 9.384v-.768c0-.744.408-1.056 1.392-1.056h.24c.984 0 1.392.312 1.392 1.056v.768c0 .744-.408 1.056-1.392 1.056h-.24c-.984 0-1.392-.312-1.392-1.056z"  /></Svg>;
}

export default SixCircledMediMedium;