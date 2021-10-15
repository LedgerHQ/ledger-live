import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ClipboardListCheckLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.96 21.36h16.08V4.272h-4.2V2.64H8.16v1.632h-4.2V21.36zm1.2-1.152V5.4h3v.48h7.68V5.4h3v14.808H5.16zM6.792 9.6l1.992 2.04 3-3-.72-.744-2.28 2.28-1.272-1.272-.72.696zM7.8 16.992h1.92v-1.92H7.8v1.92zm4.08-.36h4.92v-1.2h-4.92v1.2zm1.2-5.496h3.72v-1.2h-3.72v1.2z"  /></Svg>;
}

export default ClipboardListCheckLight;