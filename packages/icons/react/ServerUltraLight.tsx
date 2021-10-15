import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ServerUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 21.36h7.2V14.4H7.104v-2.016h9.816V14.4h-3.24v6.96h7.2V14.4h-3.192v-2.784h-5.304V9.6H15.6V2.64H8.4V9.6h3.216v2.016H6.312V14.4H3.12v6.96zm.816-.768v-5.424h5.568v5.424H3.936zm5.28-11.784v-5.4h5.568v5.4H9.216zm5.28 11.784v-5.424h5.568v5.424h-5.568z"  /></Svg>;
}

export default ServerUltraLight;