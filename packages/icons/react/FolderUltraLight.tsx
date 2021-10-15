import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FolderUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 20.04h18V5.808h-9l-1.176-1.176c-.48-.48-.96-.672-1.656-.672H3v16.08zm.84-.816V9.696h16.32v9.528H3.84zm0-10.344V4.776h5.328c.48 0 .72.072 1.056.432l1.416 1.416h8.52V8.88H3.84z"  /></Svg>;
}

export default FolderUltraLight;