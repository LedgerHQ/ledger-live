import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowDownRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.956 20.34h9.384v-9.384l-1.368-.024v4.704c0 .768.024 1.56.024 2.328L4.716 3.66 3.66 4.716l14.304 14.28c-.768-.024-1.56-.024-2.304-.024h-4.704v1.368z"  /></Svg>;
}

export default ArrowDownRegular;