import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NoneRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.24c5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12s4.08 9.24 9.24 9.24zM4.32 12c0-4.32 3.384-7.68 7.68-7.68 1.872 0 3.576.624 4.896 1.704L6.048 16.872A7.63 7.63 0 014.32 12zm2.808 5.952L17.976 7.104c1.08 1.32 1.704 3.024 1.704 4.896 0 4.176-3.36 7.68-7.68 7.68a7.63 7.63 0 01-4.872-1.728z"  /></Svg>;
}

export default NoneRegular;