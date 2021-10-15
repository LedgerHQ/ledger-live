import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MailThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 18.852h17.76V5.148H3.12v13.704zm.48-.48V8.22l8.4 6.72 8.4-6.72v10.152H3.6zm0-10.776V5.628h16.8v1.968l-8.4 6.72-8.4-6.72z"  /></Svg>;
}

export default MailThin;