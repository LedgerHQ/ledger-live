import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChristmasRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.136 21.6h1.728v-3.072h8.4l-4.056-5.664h2.136L12 2.4 4.656 12.864h2.16l-4.08 5.664h8.4V21.6zm-5.52-4.536l4.08-5.688H7.512L12 4.992l4.488 6.384h-2.184l4.08 5.688H5.616z"  /></Svg>;
}

export default ChristmasRegular;