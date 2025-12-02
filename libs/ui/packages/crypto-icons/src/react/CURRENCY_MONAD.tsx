import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#6E54FF";
function CURRENCY_MONAD({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 148 150" fill={color}><path d="M74 0C52.63 0 0 53.34 0 75c0 21.659 52.63 75 74 75 21.369 0 74-53.342 74-75C148 53.34 95.37 0 74 0zM62.468 117.887c-9.011-2.489-33.239-45.442-30.783-54.575 2.456-9.133 44.835-33.688 53.847-31.199 9.011 2.489 33.239 45.441 30.783 54.575-2.456 9.133-44.836 33.688-53.847 31.199z"  /></Svg>;
}
CURRENCY_MONAD.DefaultColor = DefaultColor;
export default CURRENCY_MONAD;