import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledPlusSolidRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.24c5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12s4.08 9.24 9.24 9.24zm-5.376-8.472v-1.56h4.56V6.624h1.656l-.024 4.584h4.56v1.56h-4.56l.024 4.608h-1.656v-4.608h-4.56z"  /></Svg>;
}

export default CircledPlusSolidRegular;