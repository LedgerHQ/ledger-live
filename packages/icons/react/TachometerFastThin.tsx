import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerFastThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.332 19.284h15.312c1.008-1.464 1.656-3.312 1.656-5.256 0-2.04-.672-3.936-1.8-5.496l-.336.36a8.803 8.803 0 011.656 5.136c0 1.752-.552 3.408-1.44 4.776H4.596a8.79 8.79 0 01-1.416-4.776c0-4.872 3.936-8.832 8.808-8.832 1.92 0 3.696.624 5.136 1.656l.36-.336a9.355 9.355 0 00-5.496-1.8c-5.136 0-9.288 4.176-9.288 9.312a9.34 9.34 0 001.632 5.256zm7.416-5.256c0 .144.096.24.24.24.072 0 .12-.024.168-.072l6.6-6.6-.336-.336-6.6 6.6a.218.218 0 00-.072.168z"  /></Svg>;
}

export default TachometerFastThin;