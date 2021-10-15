import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LightbulbThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.504 18.144v3.216h4.992v-3.216c0-1.344.432-2.088 1.656-3.504l.6-.696c1.248-1.44 1.92-2.928 1.92-4.656 0-3.984-3.144-6.648-6.672-6.648-3.528 0-6.672 2.664-6.672 6.648 0 1.728.672 3.216 1.92 4.656l.6.696c1.224 1.416 1.656 2.16 1.656 3.504zM5.808 9.288C5.808 5.592 8.712 3.12 12 3.12c3.288 0 6.192 2.472 6.192 6.168 0 1.608-.624 2.976-1.8 4.344l-.6.696c-1.248 1.44-1.776 2.352-1.776 4.08H12.24v-5.88h-.48v5.88H9.984c0-1.728-.528-2.64-1.776-4.08l-.6-.696c-1.176-1.368-1.8-2.736-1.8-4.344zM9.984 20.88v-1.992h4.032v1.992H9.984z"  /></Svg>;
}

export default LightbulbThin;