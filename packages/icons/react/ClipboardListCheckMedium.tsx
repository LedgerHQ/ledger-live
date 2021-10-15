import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ClipboardListCheckMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.6 21.84h16.8V3.96h-4.56v-1.8H8.16v1.8H3.6v17.88zm1.92-1.824V5.76h12.96v14.256H5.52zm1.2-10.392l2.184 2.208 3.192-3.192-1.104-1.104-2.088 2.088-1.08-1.104L6.72 9.624zm.96 7.416h2.4v-2.4h-2.4v2.4zM12 16.8h4.68v-1.92H12v1.92zm.96-5.472h3.72v-1.92h-3.72v1.92z"  /></Svg>;
}

export default ClipboardListCheckMedium;