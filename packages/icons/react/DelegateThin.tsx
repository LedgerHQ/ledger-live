import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DelegateThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.408 12.444v8.4h.48v-8.4A4.666 4.666 0 018.592 7.74H19.68l-1.896 1.896-1.872 1.872.336.336L20.592 7.5l-4.344-4.344-.336.336 1.872 1.872L19.68 7.26H8.592c-2.856 0-5.184 2.352-5.184 5.184z"  /></Svg>;
}

export default DelegateThin;