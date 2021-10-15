import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WalletAddUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12.18 19.38h9V6.54H6.54v.816h13.8v11.208h-8.16v.816zm-9.36-2.352h3.672V20.7h.816v-3.672h3.672v-.816H7.308V12.54h-.816v3.672H2.82v.816zm.36-5.328h.816V5.22c0-.72.384-1.104 1.104-1.104h14.064C18.9 3.612 18.348 3.3 17.7 3.3H5.1c-1.104 0-1.92.816-1.92 1.92v6.48zm12.384 1.368c0 .504.408.96.96.96.504 0 .912-.456.912-.96s-.408-.936-.912-.936a.943.943 0 00-.96.936z"  /></Svg>;
}

export default WalletAddUltraLight;