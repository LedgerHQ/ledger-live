import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ChristmasLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.34 21.36h1.32v-3h8.4l-4.032-5.64h2.04l-7.08-10.08-7.08 10.08h2.064L2.94 18.36h8.4v3zm-6.168-4.152l4.032-5.616H7.116l4.872-6.936 4.872 6.936h-2.088l4.032 5.616H5.172z"  /></Svg>;
}

export default ChristmasLight;