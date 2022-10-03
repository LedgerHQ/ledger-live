import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#1BEEF4";

function SALT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 8.584l4.353 9.16H7.647L12 8.584zM12 4.5l-7.125 15h14.25L12 4.5z"  /></Svg>;
}

SALT.DefaultColor = DefaultColor;
export default SALT;