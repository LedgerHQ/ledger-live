import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NoneUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21c5.04 0 9-4.104 9-9 0-5.04-3.96-9-9-9s-9 3.96-9 9 3.96 9 9 9zm-8.16-9c0-4.584 3.6-8.16 8.16-8.16 2.136 0 4.056.768 5.496 2.064L5.928 17.472A8.106 8.106 0 013.84 12zm2.688 6.072L18.096 6.504c1.296 1.44 2.064 3.36 2.064 5.496 0 4.44-3.576 8.16-8.16 8.16a8.106 8.106 0 01-5.472-2.088z"  /></Svg>;
}

export default NoneUltraLight;