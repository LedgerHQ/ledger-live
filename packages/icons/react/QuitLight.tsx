import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function QuitLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.72 21.6h12V2.4h-12v5.28h1.2V3.6h9.6v16.8h-9.6v-4.08h-1.2v5.28zM2.28 12l4.344 4.344.768-.768-1.464-1.464a97.168 97.168 0 00-1.584-1.536H15.72v-1.152H4.32c.552-.528 1.08-1.032 1.608-1.56L7.392 8.4l-.768-.768L2.28 12z"  /></Svg>;
}

export default QuitLight;