import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerFasterThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.308 19.284H19.62c.744-1.104 1.32-2.448 1.536-3.816h-.48c-.192 1.2-.672 2.328-1.32 3.336H4.572a8.79 8.79 0 01-1.416-4.776c0-4.872 3.936-8.832 8.808-8.832 4.368 0 8.016 3.192 8.712 7.392h.48c-.696-4.464-4.536-7.872-9.192-7.872-5.136 0-9.288 4.176-9.288 9.312a9.34 9.34 0 001.632 5.256zm7.416-5.256c0 .144.096.24.24.24h9.36v-.48h-9.36c-.144 0-.24.096-.24.24z"  /></Svg>;
}

export default TachometerFasterThin;