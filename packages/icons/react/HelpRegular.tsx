import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function HelpRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.112 13.464h.936c2.496 0 3.72-1.68 3.72-3.528 0-1.872-1.272-3.648-3.624-3.648-2.112 0-3.624 1.632-3.624 3.408v.144h1.56v-.336c0-1.224.576-1.752 1.944-1.752h.216c1.392 0 1.968.528 1.968 1.776v.96c0 1.152-.528 1.608-1.824 1.608h-1.272v1.368zM2.76 12c0 5.16 4.08 9.24 9.24 9.24 5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12zm1.56 0c0-4.32 3.384-7.68 7.68-7.68 4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68-4.296 0-7.68-3.384-7.68-7.68zm6.648 5.16h2.088v-2.088h-2.088v2.088z"  /></Svg>;
}

export default HelpRegular;