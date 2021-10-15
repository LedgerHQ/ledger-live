import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowDownLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.92 20.28h9.36v-9.384h-1.056v4.632c0 .936 0 1.92.024 2.904L4.536 3.72l-.816.816 14.712 14.688c-.96 0-1.944-.024-2.904-.024h-4.632l.024 1.08z"  /></Svg>;
}

export default ArrowDownLight;