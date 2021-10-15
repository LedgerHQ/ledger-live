import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CoffeeUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.844 16.14h2.952c1.608 0 3-.6 3.984-1.896a3.3 3.3 0 00.456-.72h.6c2.76 0 4.824-1.824 4.824-4.368 0-2.592-2.064-4.416-4.824-4.416H3.78v5.52c0 1.824.336 3.024 1.104 3.984 1.008 1.296 2.352 1.896 3.96 1.896zM2.34 18.42c.264.48.816.84 1.44.84h14.16c.648 0 1.176-.36 1.44-.84H2.34zm2.304-7.824v-5.04h11.352v5.04c0 2.856-1.296 4.704-4.152 4.704H8.796c-2.76 0-4.152-1.776-4.152-4.704zm11.904 2.112c.24-.672.312-1.464.312-2.448V5.556c2.472 0 3.936 1.248 3.936 3.456v.312c0 2.136-1.464 3.384-3.912 3.384h-.336z"  /></Svg>;
}

export default CoffeeUltraLight;