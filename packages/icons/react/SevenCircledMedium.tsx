import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SevenCircledMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.36c5.256 0 9.36-4.272 9.36-9.36 0-5.232-4.128-9.36-9.36-9.36-5.232 0-9.36 4.128-9.36 9.36 0 5.232 4.128 9.36 9.36 9.36zM4.56 12c0-4.176 3.264-7.44 7.44-7.44s7.44 3.264 7.44 7.44c0 4.056-3.264 7.44-7.44 7.44S4.56 16.176 4.56 12zm4.08-2.76h4.488v.312c-1.776 2.232-2.736 4.44-3.024 6.912h2.208c.216-3.024 1.2-5.4 3.144-7.368V7.584H8.64V9.24z"  /></Svg>;
}

export default SevenCircledMedium;