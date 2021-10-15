import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledMediMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 16.704c2.472 0 3.768-1.848 3.768-4.68 0-2.856-1.272-4.68-3.768-4.68-2.472 0-3.792 1.848-3.792 4.68s1.32 4.68 3.792 4.68zM5.76 21.36h12.48v-1.92H5.76v1.92zm0-16.8h12.48V2.64H5.76v1.92zm4.44 8.592v-2.208c0-1.68.504-1.992 1.776-1.992.72 0 1.2.096 1.488.504L10.2 13.152zm.288 1.488l3.288-3.696v2.232c0 1.656-.528 1.968-1.8 1.968-.72 0-1.2-.096-1.488-.504z"  /></Svg>;
}

export default ZeroCircledMediMedium;