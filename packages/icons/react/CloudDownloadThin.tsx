import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CloudDownloadThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.496 16.764v.48c2.544-.192 4.32-2.112 4.32-4.416 0-2.256-1.656-4.104-3.84-4.368-.264-2.832-2.664-5.016-5.496-5.016a5.577 5.577 0 00-4.824 2.784c-3 .024-5.472 2.52-5.472 5.52 0 2.592 1.8 4.752 4.2 5.376v-.48c-2.16-.6-3.72-2.52-3.72-4.896 0-2.904 2.328-5.16 5.28-5.04.864-1.68 2.496-2.784 4.536-2.784 2.784 0 4.992 2.136 5.04 4.968 2.208.096 3.816 1.728 3.816 3.936 0 2.112-1.608 3.744-3.84 3.936zm-9.84-.552L12 20.556l4.344-4.344-.336-.336-1.872 1.872-1.896 1.896v-8.448h-.48v8.448l-1.896-1.896-1.872-1.872-.336.336z"  /></Svg>;
}

export default CloudDownloadThin;