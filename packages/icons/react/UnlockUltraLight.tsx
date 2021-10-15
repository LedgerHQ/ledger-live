import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UnlockUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.904 21.18H21.96V9.588h-9.744V7.884c0-2.784-2.304-5.064-5.088-5.064-2.784 0-5.088 2.28-5.088 5.064v3.336h.84V7.884c0-2.328 1.92-4.248 4.248-4.248a4.256 4.256 0 014.248 4.248v1.704H8.904V21.18zm.84-.816v-9.96H21.12v9.96H9.744zm5.28-3.024h.84v-4.08h-.84v4.08z"  /></Svg>;
}

export default UnlockUltraLight;