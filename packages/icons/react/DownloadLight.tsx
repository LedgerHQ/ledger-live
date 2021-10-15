import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DownloadLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.16 21.6h19.68v-7.44h-4.56l-1.2 1.2h4.56v5.112H3.36V15.36h4.56l-1.2-1.2H2.16v7.44zm2.904-2.88h1.56v-1.56h-1.56v1.56zm2.592-6.744L12 16.32l4.344-4.344-.768-.768-1.464 1.464a97.129 97.129 0 00-1.536 1.584V2.4h-1.152v11.88c-.504-.552-1.032-1.08-1.536-1.608L8.4 11.208l-.744.768z"  /></Svg>;
}

export default DownloadLight;