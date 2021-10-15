import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StarThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.64 21.816L12 17.16l6.36 4.656-2.448-7.56 6.408-4.704h-7.944L12 2.184 9.624 9.552H1.68l6.384 4.704-2.424 7.56zM3.144 10.032h6.84L12 3.744l2.016 6.288h6.84l-5.496 4.032 2.088 6.48L12 16.56l-5.448 4.008 2.064-6.504-5.472-4.032z"  /></Svg>;
}

export default StarThin;