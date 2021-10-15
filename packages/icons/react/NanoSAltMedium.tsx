import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoSAltMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M14.928 19.656L5.184 9.888 8.496 6.6l9.744 9.744c.576.552.792 1.152.792 1.752a2.326 2.326 0 01-2.352 2.352c-.6 0-1.2-.24-1.752-.792zM2.64 9.888l10.392 10.416v1.536H20.4V11.832h.96V9.408h-.96V6.72h.96V4.296h-.96V2.16h-7.2v6.6L8.496 4.056 2.64 9.888zm12.768 8.208a1.28 1.28 0 001.272 1.272c.696 0 1.248-.6 1.248-1.272a1.24 1.24 0 00-1.248-1.248c-.72 0-1.272.552-1.272 1.248z"  /></Svg>;
}

export default NanoSAltMedium;