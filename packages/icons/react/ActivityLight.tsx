import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ActivityLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.148 12.648H6.42L8.988 4.92l5.976 17.976 3.456-10.248h3.432v-1.272H17.58l-2.592 7.704-6-17.976-3.432 10.272H2.148v1.272z"  /></Svg>;
}

export default ActivityLight;