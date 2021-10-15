import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoImportUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 8.844h18.72V2.82H2.64v6.024zm.792-.768V3.588h7.824c-.648.504-1.056 1.32-1.08 2.232a2.997 2.997 0 001.08 2.256H3.432zm4.224 8.76L12 21.18l4.344-4.344-.552-.552-1.608 1.608c-.576.6-1.2 1.2-1.776 1.8V10.86h-.816v8.832c-.576-.6-1.176-1.2-1.776-1.8l-1.608-1.608-.552.552zM10.944 5.82c.024-1.224 1.008-2.232 2.208-2.232h7.44v4.488h-7.44c-1.2 0-2.184-1.008-2.208-2.256zm1.008.024c0 .696.6 1.296 1.32 1.296.696 0 1.296-.6 1.296-1.296 0-.72-.6-1.32-1.296-1.32-.72 0-1.32.6-1.32 1.32zm.6 0c0-.408.312-.72.72-.72.384 0 .72.312.72.72 0 .384-.336.72-.72.72a.722.722 0 01-.72-.72z"  /></Svg>;
}

export default NanoImportUltraLight;