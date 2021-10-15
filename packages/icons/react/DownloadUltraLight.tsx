import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DownloadUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.4 21.48h19.2v-6.96h-4.32l-.84.84h4.32v5.304H3.24V15.36h4.32l-.84-.84H2.4v6.96zm2.688-2.664h1.488v-1.488H5.088v1.488zm2.568-6.72L12 16.44l4.344-4.344-.552-.552-1.656 1.68c-.576.552-1.152 1.152-1.728 1.728V2.52h-.816v12.432c-.576-.576-1.152-1.176-1.728-1.728l-1.656-1.68-.552.552z"  /></Svg>;
}

export default DownloadUltraLight;