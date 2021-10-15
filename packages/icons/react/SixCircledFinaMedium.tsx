import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SixCircledFinaMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.392 16.704c1.968 0 3.312-1.32 3.312-3.096s-1.368-3.072-3-3.072c-.696 0-1.392.24-1.824.696h-.288C8.64 9.696 9.168 9 10.416 9c.864 0 1.416.288 1.512.984h1.752c-.24-1.608-1.464-2.64-3.24-2.64-2.376 0-3.72 1.872-3.696 4.8.024 2.856 1.368 4.56 3.648 4.56zM4.2 21.36h6.24c5.256 0 9.36-4.272 9.36-9.36 0-5.232-4.128-9.36-9.36-9.36H4.2v1.92h6.24c4.176 0 7.44 3.264 7.44 7.44 0 4.056-3.264 7.44-7.44 7.44H4.2v1.92zm4.632-7.416v-.768c0-.744.408-1.056 1.392-1.056h.24c.984 0 1.392.312 1.392 1.056v.768c0 .744-.408 1.056-1.392 1.056h-.24c-.984 0-1.392-.312-1.392-1.056z"  /></Svg>;
}

export default SixCircledFinaMedium;