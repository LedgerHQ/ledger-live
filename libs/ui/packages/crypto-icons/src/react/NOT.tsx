import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";
function NOT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M6.7 19.14h10.854c1.996 0 3.261-2.153 2.257-3.893L13.112 3.636a1.137 1.137 0 00-1.97 0l-6.7 11.61c-1.002 1.74.262 3.894 2.258 3.894m6.418-12.022l1.458 2.823 3.52 6.296a.615.615 0 01-.54.92h-4.437zm-6.957 9.12L9.679 9.94l1.46-2.822v10.04H6.701a.615.615 0 01-.541-.92" /></Svg>;
}
NOT.DefaultColor = DefaultColor;
export default NOT;