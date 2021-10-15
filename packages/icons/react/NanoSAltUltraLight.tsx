import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoSAltUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.904 9.528L13.32 19.92v1.92h7.176v-9.696h.6V9.6h-.6V6.816h.6V4.32h-.6V2.16h-7.008v7.344l-5.304-5.28-5.28 5.304zm1.152 0l4.152-4.152 10.704 10.728c.624.6.888 1.296.888 2.088 0 1.608-1.344 2.952-2.928 2.952-.768 0-1.512-.312-2.112-.912L4.056 9.528zm11.136 8.664c0 .888.744 1.68 1.704 1.68.912 0 1.608-.792 1.608-1.68 0-.912-.72-1.656-1.608-1.656-.96 0-1.704.744-1.704 1.656zm.696 0c0-.552.432-.984 1.008-.984.504 0 .936.432.936.984 0 .528-.432 1.008-.936 1.008-.576 0-1.008-.48-1.008-1.008z"  /></Svg>;
}

export default NanoSAltUltraLight;