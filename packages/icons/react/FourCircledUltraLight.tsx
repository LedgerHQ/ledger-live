import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9s-9 3.96-9 9 3.96 9 9 9zm-8.16-9c0-4.584 3.6-8.16 8.16-8.16 4.584 0 8.16 3.576 8.16 8.16 0 4.44-3.576 8.16-8.16 8.16-4.56 0-8.16-3.6-8.16-8.16zm4.416 2.4h4.536v2.064h.816V14.4h1.464v-.744h-1.464V7.584h-1.344l-4.008 6.048v.768zm.816-.744l3.456-5.184h.264v5.184h-3.72z"  /></Svg>;
}

export default FourCircledUltraLight;