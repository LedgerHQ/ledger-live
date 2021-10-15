import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledInitMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.56 16.704c2.472 0 3.768-1.848 3.768-4.68 0-2.856-1.272-4.68-3.768-4.68-2.472 0-3.792 1.848-3.792 4.68s1.32 4.68 3.792 4.68zM4.2 12c0 5.232 4.128 9.36 9.36 9.36h6.24v-1.92h-6.24c-4.176 0-7.44-3.264-7.44-7.44 0-4.056 3.264-7.44 7.44-7.44h6.24V2.64h-6.24C8.304 2.64 4.2 6.912 4.2 12zm7.56 1.152v-2.208c0-1.68.504-1.992 1.776-1.992.72 0 1.2.096 1.488.504l-3.264 3.696zm.288 1.488l3.288-3.696v2.232c0 1.656-.528 1.968-1.8 1.968-.72 0-1.2-.096-1.488-.504z"  /></Svg>;
}

export default ZeroCircledInitMedium;