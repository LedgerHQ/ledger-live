import * as React from "react";
import Svg, { G, Path, Defs, ClipPath } from "react-native-svg";
type Props = {
  size?: number | string;
  color?: string;
};

function BracketleftRegular({
  size = 16,
  color = "currentColor",
}: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#prefix__clip0)">
        <Path
          d="M3.6-7.44V3.6h2.448v-8.592H20.4V-7.44H3.6zm0 38.88h16.8v-2.448H6.048V20.4H3.6v11.04z"
          fill={color}
        />
      </G>
      <Defs>
        <ClipPath id="prefix__clip0">
          <Path fill={color} d="M0 0h24v24H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export default BracketleftRegular;
