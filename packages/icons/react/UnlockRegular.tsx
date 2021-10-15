import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UnlockRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.664 21.3H22.2V9.588h-9.744V7.932c0-2.904-2.448-5.232-5.328-5.232C4.248 2.7 1.8 5.028 1.8 7.932v3.408h1.56V7.932c0-2.04 1.704-3.768 3.768-3.768 2.088 0 3.768 1.728 3.768 3.768v1.656H8.664V21.3zm1.56-1.464v-8.76H20.64v8.76H10.224zm4.44-2.376h1.56v-4.08h-1.56v4.08z"  /></Svg>;
}

export default UnlockRegular;