import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowDownUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.86 20.22h9.36v-9.36l-.768-.024v4.56c0 1.152.024 2.328.024 3.504L4.356 3.78l-.576.576 15.12 15.12c-1.176-.024-2.352-.024-3.48-.024h-4.56v.768z"  /></Svg>;
}

export default ArrowDownUltraLight;