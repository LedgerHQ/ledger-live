import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EntitiesThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.68 21.36h6v-6H4.92v-3.12h6.84v3.12H9v6h6v-6h-2.76v-3.12h6.84v3.12h-2.76v6h6v-6h-2.76v-3.6h-7.32V8.64H15v-6H9v6h2.76v3.12H4.44v3.6H1.68v6zm.48-.48v-5.04H7.2v5.04H2.16zm7.32 0v-5.04h5.04v5.04H9.48zm0-12.72V3.12h5.04v5.04H9.48zm7.32 12.72v-5.04h5.04v5.04H16.8z"  /></Svg>;
}

export default EntitiesThin;