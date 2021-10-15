import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function BuyCryptoLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 12h1.152V6.672H20.28a97.129 97.129 0 00-1.584 1.536l-1.464 1.488.744.744 4.344-4.344-4.344-4.344-.744.768 1.464 1.464a94.88 94.88 0 001.56 1.536H2.64V12zm-.96 5.904l4.344 4.344.768-.768-1.464-1.464a97.129 97.129 0 00-1.584-1.536H21.36V12h-1.152v5.328H3.72c.552-.528 1.08-1.032 1.608-1.56l1.464-1.464-.768-.768-4.344 4.368z"  /></Svg>;
}

export default BuyCryptoLight;