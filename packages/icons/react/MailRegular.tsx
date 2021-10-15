import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MailRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.76 19.212h18.48V4.788H2.76v14.424zm1.56-1.464V9.564L12 15.708l7.68-6.144v8.184H4.32zm0-10.128V6.252h15.36V7.62L12 13.764 4.32 7.62z"  /></Svg>;
}

export default MailRegular;