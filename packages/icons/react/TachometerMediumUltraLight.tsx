import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerMediumUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.26 19.584h15.456c1.128-1.536 1.848-3.504 1.848-5.568 0-4.68-3.384-8.568-7.848-9.384v.864c3.984.792 7.008 4.32 7.008 8.52 0 1.728-.552 3.36-1.44 4.728H4.692a8.689 8.689 0 01-1.416-4.728c0-4.2 3-7.728 6.984-8.52v-.864c-4.44.816-7.824 4.704-7.824 9.384 0 2.064.696 4.032 1.824 5.568zm7.32-5.568c0 .24.168.408.408.408.24 0 .432-.168.432-.408v-9.6h-.84v9.6z"  /></Svg>;
}

export default TachometerMediumUltraLight;