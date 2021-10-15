import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledFinaLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.268 12.024v1.44H8.052L11.1 8.88h.192c-.024.984-.024 2.088-.024 3.144zM4.116 21.12h6.648c5.112 0 9.12-4.152 9.12-9.12 0-5.112-4.008-9.12-9.12-9.12H4.116v1.2h6.648c4.44 0 7.92 3.48 7.92 7.92 0 4.32-3.48 7.92-7.92 7.92H4.116v1.2zM6.9 14.496h4.368v1.968h1.128v-1.968h1.44v-1.032h-1.44v-5.88H10.86L6.9 13.512v.984z"  /></Svg>;
}

export default FourCircledFinaLight;