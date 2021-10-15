import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UserLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.608 19.32v1.92h14.784v-1.92c0-1.464-.36-2.592-1.08-3.48-.96-1.272-2.544-2.04-4.296-2.04h-4.008c-1.752 0-3.312.768-4.296 2.04-.72.912-1.104 2.016-1.104 3.48zm1.272.768V18.72c0-2.304 1.44-3.672 3.792-3.672h4.68c2.328 0 3.792 1.368 3.792 3.672v1.368H5.88zm1.584-12.84c0 2.496 2.04 4.488 4.536 4.488 2.496 0 4.56-1.992 4.56-4.488 0-2.496-2.064-4.488-4.56-4.488-2.496 0-4.536 1.992-4.536 4.488zm1.2 0A3.334 3.334 0 0112 3.888a3.34 3.34 0 013.36 3.36A3.334 3.334 0 0112 10.584a3.329 3.329 0 01-3.336-3.336z"  /></Svg>;
}

export default UserLight;