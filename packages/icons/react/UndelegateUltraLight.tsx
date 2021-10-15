import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UndelegateUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.184 9.096l12.552 12.552.576-.576-18.72-18.72-.576.576 5.568 5.568A5.502 5.502 0 006.312 12v8.4h.84V12c0-1.128.36-2.112 1.032-2.904zm2.328-2.352l.72.744c.144-.024.312-.024.456-.024h8.832c-.6.576-1.176 1.152-1.752 1.728l-1.68 1.656.552.552 4.344-4.344-4.344-4.344-.552.552 1.68 1.656c.552.576 1.152 1.152 1.728 1.728h-8.832c-.408 0-.792.024-1.152.096z"  /></Svg>;
}

export default UndelegateUltraLight;