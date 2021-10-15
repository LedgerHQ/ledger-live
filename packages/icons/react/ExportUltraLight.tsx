import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ExportUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 20.46h18v-6.84h-.84v6H3.84v-6H3v6.84zM7.656 7.884l.552.552 1.68-1.68c.552-.552 1.152-1.152 1.704-1.728V16.5h.816V5.004c.576.6 1.152 1.176 1.728 1.752l1.68 1.68.528-.552L12 3.54 7.656 7.884z"  /></Svg>;
}

export default ExportUltraLight;