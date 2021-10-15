import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.664 22.32l4.656-4.656L6.312 1.68 1.68 6.336 17.664 22.32zM3.624 6.336l2.688-2.712 6.456 6.432c-.672.048-1.32.36-1.872.864a2.92 2.92 0 00-.84 1.824L3.624 6.336zm8.208 8.208c-.696-.72-.672-1.92.048-2.664.768-.72 1.944-.72 2.64-.048l5.856 5.832-2.712 2.712-5.832-5.832zm.48-1.2a1.04 1.04 0 001.032 1.032c.552 0 1.032-.48 1.032-1.032a1.04 1.04 0 00-1.032-1.032c-.576 0-1.032.456-1.032 1.032z"  /></Svg>;
}

export default NanoRegular;