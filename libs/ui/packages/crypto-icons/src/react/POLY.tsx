import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#4C5A95";

function POLY({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.25 8.072l-.033-.53-.163.445-.92.772-1.053.157-.315-.292.923-1.225.945-.274-1.023.021-1.487 1.036-1.394-.096-1.958-.961-1.156.224-3.608 2.885-1.739.537-.716.699-1.279.017-.634 1.133-.89.246.841.11.783-1.015 1.209.242-.023 1.086-.603 1.563-.345 1.446-.372.577.942-.2-.107-.59.801-1.589 1.542-.598.597-.95 1.009-.706 2.002.281 2.017-.85-.341 1.345-.897.079-.256 1.104.767-.492 1.272-.53.994-1.5.063-.708.534.53 1.553.937.883-.403-.052-1.979-.256-.766 1.153-.281.79-.937z"  /></Svg>;
}

POLY.DefaultColor = DefaultColor;
export default POLY;