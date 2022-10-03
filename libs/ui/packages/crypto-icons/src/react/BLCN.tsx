import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#2AABE4";

function BLCN({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path fillRule="evenodd" clipRule="evenodd" d="M5.925 5.25h4.65a.675.675 0 01.675.675v4.65a.675.675 0 01-.675.675h-4.65a.675.675 0 01-.675-.675v-4.65a.675.675 0 01.675-.675zm7.5 0h4.65a.675.675 0 01.675.675v4.65a.675.675 0 01-.675.675h-4.65a.675.675 0 01-.675-.675v-4.65a.675.675 0 01.675-.675zm0 7.5h4.65a.675.675 0 01.675.675v4.65a.675.675 0 01-.675.675h-4.65a.675.675 0 01-.675-.675v-4.65a.675.675 0 01.675-.675zm-7.5 0h4.65a.675.675 0 01.675.675v4.65a.675.675 0 01-.675.675h-4.65a.675.675 0 01-.675-.675v-4.65a.675.675 0 01.675-.675z"  /></Svg>;
}

BLCN.DefaultColor = DefaultColor;
export default BLCN;