import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerSlowRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.104 20.124H19.92a10.001 10.001 0 002.136-6.168c0-5.544-4.512-10.08-10.056-10.08-1.92 0-3.744.552-5.256 1.512l1.152 1.128A8.434 8.434 0 0112 5.436c4.704 0 8.496 3.816 8.496 8.52a8.388 8.388 0 01-1.368 4.608H4.872a8.388 8.388 0 01-1.368-4.608 8.18 8.18 0 011.08-4.104L3.432 8.7c-.96 1.512-1.488 3.312-1.488 5.256 0 2.328.816 4.488 2.16 6.168zM4.32 7.356l7.128 7.152a.76.76 0 00.552.216.779.779 0 00.792-.768.781.781 0 00-.24-.552L5.4 6.276l-1.08 1.08z"  /></Svg>;
}

export default TachometerSlowRegular;