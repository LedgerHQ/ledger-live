import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.36c5.256 0 9.36-4.272 9.36-9.36 0-5.232-4.128-9.36-9.36-9.36-5.232 0-9.36 4.128-9.36 9.36 0 5.232 4.128 9.36 9.36 9.36zM4.56 12c0-4.176 3.264-7.44 7.44-7.44s7.44 3.264 7.44 7.44c0 4.056-3.264 7.44-7.44 7.44S4.56 16.176 4.56 12zm3.648.024c0 2.832 1.32 4.68 3.792 4.68 2.472 0 3.768-1.848 3.768-4.68 0-2.856-1.272-4.68-3.768-4.68-2.472 0-3.792 1.848-3.792 4.68zm1.992 1.128v-2.208c0-1.68.504-1.992 1.776-1.992.72 0 1.2.096 1.488.504L10.2 13.152zm.288 1.488l3.288-3.696v2.232c0 1.656-.528 1.968-1.8 1.968-.72 0-1.2-.096-1.488-.504z"  /></Svg>;
}

export default ZeroCircledMedium;