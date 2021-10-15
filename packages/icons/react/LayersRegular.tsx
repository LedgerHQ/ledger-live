import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LayersRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 12.264l10.08-4.776L12 2.76 1.92 7.488 12 12.264zM1.92 16.488L12 21.24l10.08-4.752-1.752-.84L12 19.56l-8.328-3.912-1.752.84zm0-4.488L12 16.776 22.08 12l-1.752-.84L12 15.072 3.672 11.16 1.92 12zm3.528-4.512L12 4.416l6.552 3.072L12 10.608l-6.552-3.12z"  /></Svg>;
}

export default LayersRegular;