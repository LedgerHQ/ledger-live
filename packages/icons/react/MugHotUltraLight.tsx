import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MugHotUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.124 20.88h2.952c1.608 0 3-.6 3.984-1.896.192-.216.336-.456.456-.72h.6c2.76 0 4.824-1.824 4.824-4.368 0-2.592-2.064-4.416-4.824-4.416H3.06V15c0 1.824.336 3.024 1.104 3.984 1.008 1.296 2.352 1.896 3.96 1.896zm-4.2-5.544v-5.04h11.352v5.04c0 2.856-1.296 4.704-4.152 4.704H8.076c-2.76 0-4.152-1.776-4.152-4.704zM6.9 7.92h.888c-.12-1.176.6-1.752 2.064-1.944l1.704-.216c1.704-.192 2.832-1.08 2.736-2.64h-.864c.048 1.152-.672 1.704-2.064 1.896l-1.728.216C7.908 5.424 6.78 6.336 6.9 7.92zm8.952 9.528c.192-.672.288-1.464.288-2.448v-4.704c2.472 0 3.936 1.248 3.936 3.456v.312c0 2.136-1.464 3.384-3.912 3.384h-.312z"  /></Svg>;
}

export default MugHotUltraLight;