import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LedgerBlueLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.4 22.08h12.48c1.104 0 1.92-.816 1.92-1.92V8.4h.72V5.04h-.72v-1.2c0-1.104-.816-1.92-1.92-1.92H5.4c-1.104 0-1.92.816-1.92 1.92v16.32c0 1.104.816 1.92 1.92 1.92zm-.768-1.896V3.792c0-.456.264-.744.744-.744h12.552c.456 0 .744.288.744.744v16.392c0 .48-.288.768-.744.768H5.376c-.48 0-.744-.288-.744-.768zM6.36 19.2h10.56V4.8H6.36v14.4zm1.032-1.032V5.808h8.52v12.36h-8.52z"  /></Svg>;
}

export default LedgerBlueLight;