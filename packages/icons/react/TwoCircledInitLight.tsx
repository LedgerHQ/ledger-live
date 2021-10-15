import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledInitLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.26 16.464h6.12v-1.08l-4.752.024V15l2.64-1.8c1.536-1.056 2.112-1.944 2.112-3.072 0-1.776-1.416-2.784-3.12-2.784-1.968 0-3.216 1.344-3.216 2.856v.264h1.2v-.24c0-1.104.576-1.8 1.944-1.8h.12c1.176 0 1.872.528 1.872 1.728 0 .84-.312 1.416-1.896 2.496l-3.024 2.088v1.728zM4.116 12c0 5.088 4.032 9.12 9.12 9.12h6.648v-1.2h-6.648c-4.44 0-7.92-3.48-7.92-7.92 0-4.32 3.48-7.92 7.92-7.92h6.648v-1.2h-6.648c-5.112 0-9.12 4.152-9.12 9.12z"  /></Svg>;
}

export default TwoCircledInitLight;