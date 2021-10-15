import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PenUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.436 21.552l5.664-1.56 13.464-13.44-4.128-4.104-13.44 13.44-1.56 5.664zM3.588 20.4l1.152-4.104 2.952 2.952L3.588 20.4zm1.704-4.68l9.456-9.456 2.976 2.976-9.456 9.456-2.976-2.976zM15.324 5.712l2.112-2.136 2.976 2.976-2.136 2.112-2.952-2.952z"  /></Svg>;
}

export default PenUltraLight;