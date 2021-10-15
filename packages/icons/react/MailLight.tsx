import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MailLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.88 19.092h18.24V4.908H2.88v14.184zm1.2-1.152V9.108L12 15.444l7.92-6.336v8.832H4.08zm0-10.32V6.036h15.84V7.62L12 13.956 4.08 7.62z"  /></Svg>;
}

export default MailLight;