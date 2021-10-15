import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledNorthEastMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.144 16.152l5.04-5.04c-.024.6-.072 1.176-.072 1.752l.024 1.512h1.656V8.208H9.648v1.68h1.512c.528 0 1.128 0 1.704-.048l-5.016 5.016 1.296 1.296zM2.64 12c0 5.232 4.128 9.36 9.36 9.36 5.256 0 9.36-4.272 9.36-9.36 0-5.232-4.128-9.36-9.36-9.36-5.232 0-9.36 4.128-9.36 9.36zm1.92 0c0-4.176 3.264-7.44 7.44-7.44s7.44 3.264 7.44 7.44c0 4.056-3.264 7.44-7.44 7.44S4.56 16.176 4.56 12z"  /></Svg>;
}

export default CircledNorthEastMedium;