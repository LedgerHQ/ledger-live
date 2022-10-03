import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";

function MOAC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.985 12.026L7.208 7.249l-.103-.156-1.699-1.661v13.136h1.713V9.482l3.687 3.739L12 14.415l1.194-1.194 3.687-3.74v9.087h1.713V5.432l-1.713 1.661-4.896 4.933z"  /></Svg>;
}

MOAC.DefaultColor = DefaultColor;
export default MOAC;