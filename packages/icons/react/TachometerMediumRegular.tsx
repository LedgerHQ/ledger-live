import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TachometerMediumRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.068 20.136h15.84c1.32-1.68 2.16-3.84 2.16-6.168 0-4.728-3.312-8.736-7.728-9.792v1.632c3.552 1.008 6.168 4.296 6.168 8.16a8.406 8.406 0 01-1.392 4.608H4.86a8.388 8.388 0 01-1.368-4.608 8.488 8.488 0 016.144-8.16V4.176C5.22 5.232 1.932 9.24 1.932 13.968c0 2.328.816 4.488 2.136 6.168zm7.152-6.168c0 .432.336.768.768.768a.779.779 0 00.792-.768V3.864h-1.56v10.104z"  /></Svg>;
}

export default TachometerMediumRegular;