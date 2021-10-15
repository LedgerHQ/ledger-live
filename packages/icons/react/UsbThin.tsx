import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UsbThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.012 22.32c.792 0 1.44-.648 1.44-1.44 0-.72-.528-1.296-1.2-1.416v-4.488l4.344-1.368c.768-.24 1.248-.864 1.248-1.632V8.088h.456v-1.44h-1.44v1.44h.504v3.888c0 .6-.288.984-.912 1.176l-4.2 1.32V3.6h.912l-1.176-1.92-1.152 1.92h.936v12.72l-4.104-1.368c-.6-.192-.888-.552-.888-1.152V9.936a.828.828 0 00.6-.792.85.85 0 00-.84-.84.85.85 0 00-.84.84c0 .384.264.696.6.792V13.8c0 .768.48 1.368 1.224 1.608l4.248 1.416v2.64c-.672.12-1.2.696-1.2 1.416 0 .792.648 1.44 1.44 1.44z"  /></Svg>;
}

export default UsbThin;