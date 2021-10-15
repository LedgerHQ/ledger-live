import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WalletAddLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.12 19.56h9.12V6.6H6.48v1.128h13.56v10.68h-7.92v1.152zm-9.36-2.304h3.504v3.504h1.152v-3.504h3.504v-1.152H7.416V12.6H6.264v3.504H2.76v1.152zM3 11.64h1.152V5.16c0-.528.264-.792.768-.792h14.328c-.192-.672-.816-1.128-1.608-1.128H4.92C3.816 3.24 3 4.056 3 5.16v6.48zm12.384 1.536c0 .576.48 1.08 1.08 1.08.552 0 1.032-.504 1.032-1.08 0-.552-.48-1.032-1.032-1.032-.6 0-1.08.48-1.08 1.032z"  /></Svg>;
}

export default WalletAddLight;