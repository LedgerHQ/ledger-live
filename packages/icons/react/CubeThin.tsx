import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CubeThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.984l8.64-5.016V7.032L12 2.016 3.36 7.032v9.936L12 21.984zM3.84 16.68V7.584l7.92 4.56v9.144L3.84 16.68zm.24-9.504L12 2.592l7.92 4.584L12 11.712 4.08 7.176zm8.16 14.112v-9.144l7.92-4.56v9.096l-7.92 4.608z"  /></Svg>;
}

export default CubeThin;