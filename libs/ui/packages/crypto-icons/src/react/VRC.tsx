import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#418bca";
function VRC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M15.199 5.25h3.551L12 18.75 5.25 5.25h3.528l3.245 6.835zM12 8.97c-.591 0-1.07-.493-1.07-1.1 0-.606.479-1.099 1.07-1.099s1.07.493 1.07 1.1c0 .606-.48 1.098-1.07 1.098M16.849 12c.59 0 1.07.492 1.07 1.099s-.48 1.098-1.07 1.098-1.07-.491-1.07-1.098S16.258 12 16.848 12" /></Svg>;
}
VRC.DefaultColor = DefaultColor;
export default VRC;