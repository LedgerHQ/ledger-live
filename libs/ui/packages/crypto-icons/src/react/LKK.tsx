import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#9D01EB";

function LKK({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.504 19.875v-2.742L12 12.555l4.482 4.579v2.741L12 15.295l-4.496 4.58zM3.75 10.6h6.352L12 12.555H5.648L3.75 10.6zm16.5 0l-1.898 1.954H12V4.125l1.898 1.94V10.6h6.352z"  /></Svg>;
}

LKK.DefaultColor = DefaultColor;
export default LKK;