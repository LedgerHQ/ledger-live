import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TrophyRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.96 20.4h10.08v-1.464h-4.224v-3c1.512-.072 2.76-.672 3.672-1.872a4.291 4.291 0 00.864-1.752c1.344-.096 2.352-.672 3.12-1.656.624-.792.888-1.8.888-3.288V4.512h-3.792V3.6H6.408v.912H2.64v2.856c0 1.488.264 2.496.888 3.288.768.984 1.776 1.56 3.144 1.656.168.672.456 1.248.864 1.752.936 1.2 2.136 1.8 3.648 1.872v3H6.96V20.4zM4.2 8.184V5.976h2.232v4.104c0 .264 0 .528.048.744-1.608-.096-2.28-.936-2.28-2.64zm3.888 2.928V5.064h7.824v6.024c0 2.28-.912 3.312-3.24 3.312h-1.32c-2.304 0-3.264-1.032-3.264-3.288zm9.456-.288c.024-.216.024-.48.024-.744V5.976H19.8v2.208c0 1.896-.84 2.568-2.256 2.64z"  /></Svg>;
}

export default TrophyRegular;