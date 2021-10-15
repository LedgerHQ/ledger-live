import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TransferUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.016 12.288l4.344-4.344L17.016 3.6l-.552.552 1.68 1.656c.552.576 1.152 1.152 1.728 1.728H3.6v.816h16.296c-.6.576-1.176 1.152-1.752 1.728l-1.68 1.656.552.552zM2.64 16.056L6.984 20.4l.552-.552-1.68-1.68c-.552-.552-1.152-1.152-1.728-1.704H20.4v-.816H4.128c.576-.576 1.176-1.152 1.728-1.728l1.68-1.68-.552-.528-4.344 4.344z"  /></Svg>;
}

export default TransferUltraLight;