import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DelegateLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.408 12.444v8.4h1.2v-8.4c0-2.496 1.872-4.368 4.344-4.368h9.6a97.129 97.129 0 00-1.584 1.536L15.504 11.1l.744.744L20.592 7.5l-4.344-4.344-.744.768 1.464 1.464c.504.504 1.032 1.032 1.56 1.536H8.952c-3.048 0-5.544 2.496-5.544 5.52z"  /></Svg>;
}

export default DelegateLight;