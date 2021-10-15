import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MicrochipRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.824 21.24h1.392v-3.36h2.088v3.36h1.392v-3.36h2.088v3.36h1.392v-3.36h1.704v-1.704h3.36v-1.392h-3.36v-2.088h3.36v-1.392h-3.36V9.216h3.36V7.824h-3.36V6.12h-1.704V2.76h-1.392v3.36h-2.088V2.76h-1.392v3.36H9.216V2.76H7.824v3.36H6.12v1.704H2.76v1.392h3.36v2.088H2.76v1.392h3.36v2.088H2.76v1.392h3.36v1.704h1.704v3.36zm-.24-4.824V7.584h8.832v8.832H7.584zm2.712-2.712h3.408v-3.408h-3.408v3.408z"  /></Svg>;
}

export default MicrochipRegular;