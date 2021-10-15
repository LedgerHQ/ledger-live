import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ComputerUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.304 20.4H18.72a1.707 1.707 0 00-1.44-.792h-2.568l-.696-3.288h5.544c.984 0 1.8-.816 1.8-1.8V5.4c0-.984-.816-1.8-1.8-1.8H4.44c-.984 0-1.8.816-1.8 1.8v9.12c0 .984.816 1.8 1.8 1.8h5.544l-.696 3.288H6.72c-.6 0-1.152.336-1.416.792zM3.48 14.496V5.4c0-.6.408-.984 1.008-.984h15.024c.6 0 1.008.384 1.008.984v9.096c0 .6-.408 1.008-1.008 1.008H4.488c-.6 0-1.008-.408-1.008-1.008zm6.6 5.112l.696-3.288h2.448l.696 3.288h-3.84z"  /></Svg>;
}

export default ComputerUltraLight;