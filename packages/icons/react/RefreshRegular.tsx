import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RefreshRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.76 11.88v.768h1.56v-.768c0-4.224 3.408-7.56 7.656-7.56a7.58 7.58 0 016.192 3.144 30.339 30.339 0 00-2.088-.072h-1.8v1.392h6.144V2.64h-1.392v1.8c0 .6.024 1.224.048 1.848-1.848-2.352-4.488-3.528-7.104-3.528-5.112 0-9.216 4.032-9.216 9.12zm.84 9.48h1.392v-1.8c0-.6-.024-1.224-.048-1.848 1.848 2.352 4.488 3.528 7.08 3.528 5.112 0 9.216-4.056 9.216-9.12v-.768h-1.56v.768c0 4.224-3.384 7.56-7.656 7.56-2.544 0-4.776-1.248-6.168-3.144.672.048 1.416.048 2.088.048h1.8v-1.368H3.6v6.144z"  /></Svg>;
}

export default RefreshRegular;