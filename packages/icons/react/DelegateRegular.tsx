import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DelegateRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.408 12.444v8.4h1.56v-8.4c0-2.424 1.752-4.2 4.176-4.2H18a81.67 81.67 0 00-1.464 1.368l-1.248 1.272.96.984L20.592 7.5l-4.344-4.344-.96.984 1.248 1.248c.456.456.936.912 1.416 1.368H9.144c-3.168 0-5.736 2.592-5.736 5.688z"  /></Svg>;
}

export default DelegateRegular;