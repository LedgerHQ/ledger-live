import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledInitMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.416 16.464h6.36v-1.656l-4.104.024v-.312l2.232-1.368c1.416-.864 1.992-1.8 1.992-2.928 0-1.8-1.464-2.88-3.312-2.88-1.992 0-3.384 1.296-3.384 2.808v.312h1.896V10.2c0-.864.288-1.176 1.392-1.176h.168c1.008 0 1.32.312 1.32 1.248 0 .672-.168 1.176-1.776 2.184l-2.784 1.752v2.256zM4.2 12c0 5.232 4.128 9.36 9.36 9.36h6.24v-1.92h-6.24c-4.176 0-7.44-3.264-7.44-7.44 0-4.056 3.264-7.44 7.44-7.44h6.24V2.64h-6.24C8.304 2.64 4.2 6.912 4.2 12z"  /></Svg>;
}

export default TwoCircledInitMedium;