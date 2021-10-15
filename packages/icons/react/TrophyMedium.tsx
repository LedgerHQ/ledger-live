import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TrophyMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.96 20.4h10.08v-1.8h-4.008v-2.664c1.368-.12 2.568-.72 3.456-1.872a4.291 4.291 0 00.864-1.752c1.344-.096 2.352-.672 3.12-1.656.624-.792.888-1.8.888-3.288V4.512h-3.792V3.6H6.408v.912H2.64v2.856c0 1.488.264 2.496.888 3.288.768.984 1.776 1.56 3.144 1.656.168.672.456 1.248.864 1.752.888 1.152 2.064 1.752 3.456 1.872V18.6H6.96v1.8zM4.56 8.448V6.312h1.872v4.2c-1.368-.096-1.872-.648-1.872-2.064zM8.472 11.4v-6h7.056v6c0 1.968-.744 2.64-2.808 2.64h-1.416c-2.088 0-2.832-.672-2.832-2.64zm9.096-.888v-4.2h1.872v2.136c0 1.416-.504 1.968-1.872 2.064z"  /></Svg>;
}

export default TrophyMedium;