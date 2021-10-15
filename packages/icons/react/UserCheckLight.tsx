import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UserCheckLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.192 19.32v1.92h14.784v-3.192l-1.248 1.272v.768H4.464V18.72c0-2.304 1.44-3.672 3.792-3.672h2.04L9.024 13.8h-.552c-1.752 0-3.192.768-4.176 2.04-.72.912-1.104 2.016-1.104 3.48zM6.048 7.248c0 2.496 2.04 4.488 4.536 4.488 2.496 0 4.56-1.992 4.56-4.488 0-2.496-2.064-4.488-4.56-4.488-2.496 0-4.536 1.992-4.536 4.488zm1.2 0a3.334 3.334 0 013.336-3.36 3.34 3.34 0 013.36 3.36 3.334 3.334 0 01-3.36 3.336 3.329 3.329 0 01-3.336-3.336zM12 14.136l3.24 3.264 5.568-5.568-.84-.84-4.728 4.704-2.4-2.4-.84.84z"  /></Svg>;
}

export default UserCheckLight;