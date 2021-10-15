import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ExternalLinkMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 21.36l16.8-.024V12h-1.92v7.416l-12.96.024V6.48H12V4.56H2.64v16.8zm7.896-9.192l1.296 1.296 7.92-7.92c-.024.6-.072 1.176-.072 1.752l.024 1.512h1.656V2.64h-6.144v1.68h1.512c.528 0 1.128 0 1.704-.048l-7.896 7.896z"  /></Svg>;
}

export default ExternalLinkMedium;