import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledInitRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.584 12.216v1.08h-2.712l2.64-4.008h.12c-.024.888-.048 1.944-.048 2.928zM4.152 12c0 5.16 4.08 9.24 9.24 9.24h6.456v-1.56h-6.456c-4.296 0-7.68-3.384-7.68-7.68 0-4.2 3.384-7.68 7.68-7.68h6.456V2.76h-6.456c-5.184 0-9.24 4.2-9.24 9.24zm5.256 2.568h4.176v1.896h1.488v-1.896h1.392v-1.272h-1.392V7.584h-1.8l-3.864 5.832v1.152z"  /></Svg>;
}

export default FourCircledInitRegular;