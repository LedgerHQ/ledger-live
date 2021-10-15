import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ImportUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3 20.22h18v-6.84h-.84v6H3.84v-6H3v6.84zm4.656-7.824L12 16.74l4.344-4.344-.552-.552-1.656 1.68c-.576.552-1.152 1.152-1.728 1.728V3.78h-.816v11.472c-.576-.576-1.152-1.176-1.728-1.728l-1.656-1.68-.552.552z"  /></Svg>;
}

export default ImportUltraLight;