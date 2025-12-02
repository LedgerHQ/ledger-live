import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function STTON({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M4.395 8.514c-.915-1.575.22-3.55 2.042-3.55h11.381c1.817 0 2.954 1.966 2.048 3.54L12.998 20.45a.962.962 0 01-1.666.004zm2.042-1.8a.612.612 0 00-.53.92l6.254 10.763 6.188-10.765a.612.612 0 00-.53-.917z" clipRule="evenodd" /><path  d="M11.398 11.724v-4.2L9.54 8.596v4.046l1.86 1.204 1.53-1.029z" /><path  d="M13.214 8.596l-1.509.875 1.51 1.203v2.493l1.662-.918V9.624z" /></Svg>;
}
STTON.DefaultColor = DefaultColor;
export default STTON;