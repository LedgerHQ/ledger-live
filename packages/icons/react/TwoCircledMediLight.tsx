import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TwoCircledMediLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.024 16.464h6.12v-1.08l-4.752.024V15l2.64-1.8c1.536-1.056 2.112-1.944 2.112-3.072 0-1.776-1.416-2.784-3.12-2.784-1.968 0-3.216 1.32-3.216 2.856v.264h1.2v-.24c0-1.104.576-1.8 1.944-1.8h.12c1.176 0 1.872.528 1.872 1.728 0 .816-.312 1.416-1.896 2.496l-3.024 2.088v1.728zM5.76 21.12h12.48v-1.2H5.76v1.2zm0-17.04h12.48v-1.2H5.76v1.2z"  /></Svg>;
}

export default TwoCircledMediLight;