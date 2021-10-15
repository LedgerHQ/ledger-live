import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TransferThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.016 12.288l4.344-4.344L17.016 3.6l-.336.336 1.872 1.872 1.896 1.896H3.6v.48h16.848l-1.896 1.896-1.872 1.872.336.336zM2.64 16.056L6.984 20.4l.336-.336-1.872-1.872-1.896-1.896H20.4v-.48H3.552l1.896-1.896 1.872-1.872-.336-.336-4.344 4.344z"  /></Svg>;
}

export default TransferThin;