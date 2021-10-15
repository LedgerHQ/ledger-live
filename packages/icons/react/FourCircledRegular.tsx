import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.24c5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12s4.08 9.24 9.24 9.24zM4.32 12c0-4.32 3.384-7.68 7.68-7.68 4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68-4.296 0-7.68-3.384-7.68-7.68zm3.696 2.568h4.176v1.896h1.488v-1.896h1.392v-1.272H13.68V7.584h-1.8l-3.864 5.832v1.152zm1.464-1.272l2.64-4.008h.12c-.024.888-.048 1.944-.048 2.928v1.08H9.48z"  /></Svg>;
}

export default FourCircledRegular;