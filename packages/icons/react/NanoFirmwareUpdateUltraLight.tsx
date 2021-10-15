import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoFirmwareUpdateUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 21.18h18.72v-6.024H2.64v6.024zm.792-.792v-4.464h7.824c-.648.504-1.056 1.32-1.08 2.232.024.912.432 1.728 1.08 2.232H3.432zM7.656 8.796L12 13.14l4.344-4.344-.552-.552-1.608 1.608c-.576.6-1.2 1.2-1.776 1.8V2.82h-.816v8.832c-.576-.6-1.176-1.2-1.776-1.8L8.208 8.244l-.552.552zm3.288 9.36c.024-1.224 1.008-2.232 2.208-2.232h7.44v4.464h-7.44c-1.2 0-2.184-1.008-2.208-2.232zm1.008 0c0 .72.6 1.32 1.32 1.32.696 0 1.296-.6 1.296-1.32 0-.72-.6-1.296-1.296-1.296-.72 0-1.32.576-1.32 1.296zm.6 0c0-.384.312-.72.72-.72.384 0 .72.336.72.72 0 .408-.336.72-.72.72a.707.707 0 01-.72-.72z"  /></Svg>;
}

export default NanoFirmwareUpdateUltraLight;