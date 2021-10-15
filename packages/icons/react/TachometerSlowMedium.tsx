import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerSlowMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.008 20.4h15.984a10.231 10.231 0 002.328-6.48C22.32 8.232 17.688 3.6 12 3.6c-1.896 0-3.672.504-5.184 1.392l1.416 1.416A8.3 8.3 0 0112 5.52c4.632 0 8.4 3.768 8.4 8.4 0 1.68-.504 3.24-1.368 4.56H4.968A8.288 8.288 0 013.6 13.92a8.3 8.3 0 01.888-3.768L3.072 8.736A10.209 10.209 0 001.68 13.92c0 2.448.888 4.728 2.328 6.48zm0-13.128l7.32 7.32a.872.872 0 00.672.288c.528 0 .96-.432.96-.96a.872.872 0 00-.288-.672l-7.32-7.32-1.344 1.344z"  /></Svg>;
}

export default TachometerSlowMedium;