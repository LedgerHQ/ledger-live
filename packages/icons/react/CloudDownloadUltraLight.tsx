import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CloudDownloadUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.652 16.464v.816c2.52-.216 4.296-2.16 4.296-4.512a4.48 4.48 0 00-3.864-4.44c-.312-2.832-2.76-4.968-5.592-4.968a5.677 5.677 0 00-4.92 2.832c-3 .024-5.52 2.496-5.52 5.568 0 2.544 1.728 4.704 4.128 5.376v-.864c-1.92-.6-3.288-2.352-3.288-4.512 0-2.856 2.4-5.016 5.232-4.704.744-1.752 2.376-2.88 4.368-2.88 2.688 0 4.872 2.112 4.776 4.92 2.16-.048 3.84 1.512 3.84 3.672 0 1.944-1.44 3.48-3.456 3.696zm-10.008-.168l4.344 4.344 4.344-4.344-.552-.552-1.656 1.68c-.576.552-1.152 1.152-1.728 1.728V11.28h-.816v7.872c-.576-.576-1.152-1.176-1.728-1.728l-1.656-1.68-.552.552z"  /></Svg>;
}

export default CloudDownloadUltraLight;