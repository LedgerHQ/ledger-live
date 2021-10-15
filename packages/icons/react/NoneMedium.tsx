import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NoneMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.36c5.256 0 9.36-4.272 9.36-9.36 0-5.232-4.128-9.36-9.36-9.36-5.232 0-9.36 4.128-9.36 9.36 0 5.232 4.128 9.36 9.36 9.36zM4.56 12c0-4.176 3.264-7.44 7.44-7.44 1.728 0 3.312.576 4.56 1.536L6.096 16.56A7.456 7.456 0 014.56 12zm2.88 5.904L17.904 7.44A7.456 7.456 0 0119.44 12c0 4.056-3.264 7.44-7.44 7.44a7.456 7.456 0 01-4.56-1.536z"  /></Svg>;
}

export default NoneMedium;