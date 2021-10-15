import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledMediMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.856 16.464h6.36v-1.656l-4.104.024v-.312l2.232-1.368c1.416-.864 1.992-1.8 1.992-2.928 0-1.8-1.464-2.88-3.312-2.88-1.992 0-3.384 1.296-3.384 2.808v.312h1.896V10.2c0-.864.288-1.176 1.392-1.176h.168c1.008 0 1.32.312 1.32 1.248 0 .672-.168 1.176-1.776 2.184l-2.784 1.752v2.256zM5.76 21.36h12.48v-1.92H5.76v1.92zm0-16.8h12.48V2.64H5.76v1.92z"  /></Svg>;
}

export default TwoCircledMediMedium;