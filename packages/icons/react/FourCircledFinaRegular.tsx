import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledFinaRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.8 12.216v1.08H8.088l2.64-4.008h.12c-.024.888-.048 1.944-.048 2.928zM4.152 21.24h6.456c5.184 0 9.24-4.224 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24H4.152v1.56h6.456c4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68H4.152v1.56zm2.472-6.672H10.8v1.896h1.488v-1.896h1.392v-1.272h-1.392V7.584h-1.8l-3.864 5.832v1.152z"  /></Svg>;
}

export default FourCircledFinaRegular;