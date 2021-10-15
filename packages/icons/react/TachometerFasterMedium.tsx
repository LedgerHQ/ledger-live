import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerFasterMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.008 20.4h15.96c.84-.888 1.632-2.424 2.016-3.84h-2.016c-.24.672-.552 1.344-.936 1.92H4.968A8.288 8.288 0 013.6 13.92c0-4.632 3.768-8.4 8.4-8.4 3.72 0 6.864 2.4 7.968 5.76h2.016C20.808 6.864 16.8 3.6 12 3.6 6.312 3.6 1.68 8.232 1.68 13.92c0 2.448.888 4.728 2.328 6.48zm7.032-6.48c0 .528.432.96.96.96h10.32v-1.92H12a.963.963 0 00-.96.96z"  /></Svg>;
}

export default TachometerFasterMedium;