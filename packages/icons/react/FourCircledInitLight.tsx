import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledInitLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.74 12.024v1.44H10.5l3.072-4.584h.192c-.024.984-.024 2.088-.024 3.144zM4.116 12c0 5.088 4.032 9.12 9.12 9.12h6.648v-1.2h-6.648c-4.44 0-7.92-3.48-7.92-7.92 0-4.32 3.48-7.92 7.92-7.92h6.648v-1.2h-6.648c-5.112 0-9.12 4.152-9.12 9.12zm5.256 2.496h4.368v1.968h1.128v-1.968h1.44v-1.032h-1.44v-5.88h-1.56l-3.936 5.928v.984z"  /></Svg>;
}

export default FourCircledInitLight;