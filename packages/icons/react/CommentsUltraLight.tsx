import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CommentsUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 4.944v12.36l3.984-3.072h11.088V4.944c0-.984-.84-1.8-1.8-1.8H4.44c-.984 0-1.8.816-1.8 1.8zm.84 10.68V4.944c0-.528.456-.984 1.008-.984h11.376c.552 0 1.008.456 1.008.984v8.496H6.312L3.48 15.624zm4.08.36c0 .984.816 1.8 1.8 1.8h8.016l3.984 3.072V8.736c0-.984-.84-1.824-1.824-1.824v.84c.528 0 .984.48.984 1.104v10.32l-2.856-2.208h-8.16c-.648 0-1.104-.456-1.104-.984h-.84z"  /></Svg>;
}

export default CommentsUltraLight;