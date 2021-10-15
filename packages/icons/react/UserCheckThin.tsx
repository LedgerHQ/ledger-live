import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UserCheckThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.312 19.08v2.04h14.544v-2.76l-.48.48v1.8H3.792v-1.56c0-2.616 2.136-4.68 4.752-4.68h1.2l-.48-.48h-.72c-1.656 0-3.192.816-4.152 2.064a5.05 5.05 0 00-1.08 3.096zM6.336 7.128a4.24 4.24 0 004.248 4.248 4.24 4.24 0 004.248-4.248 4.24 4.24 0 00-4.248-4.248 4.24 4.24 0 00-4.248 4.248zm.48 0a3.76 3.76 0 013.768-3.768 3.76 3.76 0 013.768 3.768 3.76 3.76 0 01-3.768 3.768 3.76 3.76 0 01-3.768-3.768zm5.304 6.792l3.12 3.12 5.448-5.448-.336-.336-5.112 5.112-2.784-2.784-.336.336z"  /></Svg>;
}

export default UserCheckThin;