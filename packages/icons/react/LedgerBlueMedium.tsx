import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LedgerBlueMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.04 22.32H18c1.104 0 1.92-.816 1.92-1.92v-12h.96V5.04h-.96V3.6c0-1.104-.816-1.92-1.92-1.92H5.04c-1.104 0-1.92.816-1.92 1.92v16.8c0 1.104.816 1.92 1.92 1.92zm-.12-1.848V3.528c0-.024.024-.048.048-.048h13.104c.024 0 .048.024.048.048v16.944a.052.052 0 01-.048.048H4.968a.052.052 0 01-.048-.048zm1.56-1.512h10.08V5.04H6.48v13.92zm1.56-1.56V6.6H15v10.8H8.04z"  /></Svg>;
}

export default LedgerBlueMedium;