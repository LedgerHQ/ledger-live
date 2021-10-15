import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UserThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.728 19.08v2.04h14.544v-2.04a5.05 5.05 0 00-1.08-3.096c-.96-1.248-2.496-2.064-4.152-2.064H9.96c-1.656 0-3.192.816-4.152 2.064a5.05 5.05 0 00-1.08 3.096zm.48 1.56v-1.56c0-2.616 2.136-4.68 4.752-4.68h4.08c2.616 0 4.752 2.064 4.752 4.68v1.56H5.208zM7.752 7.128A4.24 4.24 0 0012 11.376a4.24 4.24 0 004.248-4.248A4.24 4.24 0 0012 2.88a4.24 4.24 0 00-4.248 4.248zm.48 0A3.76 3.76 0 0112 3.36a3.76 3.76 0 013.768 3.768A3.76 3.76 0 0112 10.896a3.76 3.76 0 01-3.768-3.768z"  /></Svg>;
}

export default UserThin;