import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ImportLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.88 20.28h18.24v-6.96h-1.2v5.76H4.08v-5.76h-1.2v6.96zm4.776-7.944L12 16.68l4.344-4.344-.768-.768-1.464 1.464a97.129 97.129 0 00-1.536 1.584V3.72h-1.152v10.92c-.504-.552-1.032-1.08-1.536-1.608L8.4 11.568l-.744.768z"  /></Svg>;
}

export default ImportLight;