import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledMediRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.192 12.216v1.08H9.48l2.64-4.008h.12c-.024.888-.048 1.944-.048 2.928zM5.76 21.24h12.48v-1.56H5.76v1.56zm0-16.92h12.48V2.76H5.76v1.56zm2.256 10.248h4.176v1.896h1.488v-1.896h1.392v-1.272H13.68V7.584h-1.8l-3.864 5.832v1.152z"  /></Svg>;
}

export default FourCircledMediRegular;