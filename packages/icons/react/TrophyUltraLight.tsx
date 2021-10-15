import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TrophyUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.96 20.4h10.08v-.816h-4.608V15.96c1.752-.024 3.096-.624 4.056-1.896a4.291 4.291 0 00.864-1.752c1.344-.096 2.352-.672 3.12-1.656.624-.792.888-1.8.888-3.288V4.512h-3.792V3.6H6.432v.912H2.64v2.856c0 1.488.264 2.496.888 3.288.768.984 1.776 1.56 3.144 1.656.168.672.456 1.248.864 1.752.984 1.272 2.28 1.872 4.032 1.896v3.624H6.96v.816zM3.48 7.632V5.328h2.952v4.752c0 .528.024.984.096 1.416C4.512 11.328 3.48 9.96 3.48 7.632zm3.816 2.88V4.416h9.408v6.072c0 2.904-1.296 4.608-4.152 4.608h-1.104c-2.76 0-4.152-1.704-4.152-4.584zm10.176.984c.072-.432.096-.888.096-1.416V5.328h2.952v2.304c0 2.904-1.536 3.744-3.048 3.864z"  /></Svg>;
}

export default TrophyUltraLight;