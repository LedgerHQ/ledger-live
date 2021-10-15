import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShieldCheckUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.84c6.24-2.472 9.36-6.408 9.36-11.712v-5.04C18.696 3.168 15.456 2.16 12 2.16c-3.456 0-6.696 1.008-9.36 2.928v5.04c0 5.304 3.12 9.24 9.36 11.712zM3.48 10.128V5.496c2.472-1.68 5.352-2.52 8.52-2.52 3.168 0 6.048.84 8.52 2.52v4.632c0 4.944-2.712 8.448-8.52 10.824-5.808-2.376-8.52-5.88-8.52-10.824zm4.632 1.008l3.168 3.192 5.496-5.52-.576-.576-4.92 4.896-2.592-2.568-.576.576z"  /></Svg>;
}

export default ShieldCheckUltraLight;