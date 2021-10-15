import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MailMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 19.332h18.72V4.668H2.64v14.664zm1.92-1.8V9.996L12 15.948l7.44-5.952v7.536H4.56zm0-9.888V6.468h14.88v1.176L12 13.596 4.56 7.644z"  /></Svg>;
}

export default MailMedium;