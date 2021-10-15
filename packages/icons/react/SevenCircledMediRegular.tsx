import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SevenCircledMediRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.064 16.464h1.8c.24-3.096 1.32-5.544 3.336-7.488V7.584H9.48v1.368h4.848v.312c-1.896 2.16-2.952 4.536-3.264 7.2zM5.76 21.24h12.48v-1.56H5.76v1.56zm0-16.92h12.48V2.76H5.76v1.56z"  /></Svg>;
}

export default SevenCircledMediRegular;