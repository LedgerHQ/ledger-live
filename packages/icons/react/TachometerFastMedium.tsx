import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerFastMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.008 20.4h15.984a10.231 10.231 0 002.328-6.48c0-1.896-.504-3.672-1.392-5.184l-1.416 1.416a8.3 8.3 0 01.888 3.768c0 1.68-.504 3.24-1.368 4.56H4.968A8.288 8.288 0 013.6 13.92c0-4.632 3.768-8.4 8.4-8.4a8.3 8.3 0 013.768.888l1.416-1.416A10.209 10.209 0 0012 3.6C6.312 3.6 1.68 8.232 1.68 13.92c0 2.448.888 4.728 2.328 6.48zm7.032-6.48c0 .528.432.96.96.96a.872.872 0 00.672-.288l7.32-7.32-1.344-1.344-7.32 7.32a.872.872 0 00-.288.672z"  /></Svg>;
}

export default TachometerFastMedium;