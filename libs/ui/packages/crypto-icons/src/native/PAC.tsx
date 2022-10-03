import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#F5EB16";

function PAC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M11.998 3a9 9 0 10.004 18 9 9 0 00-.004-18zM8.344 6.943a.093.093 0 01.094-.09h3.75a5.263 5.263 0 012.281.473c.136.066.27.14.399.22l-2.44 1.397h-1.274a.093.093 0 00-.09.095v.703l-2.72 1.572v-4.37zm-1.01 7.9l-1.63-1.647 5.368-3.097v2.007a.093.093 0 00.095.09h.766L7.34 14.843h-.006zm8.039-1.53c-.787.657-1.868.985-3.241.985h-.978a.093.093 0 00-.093.093v2.027l-1.365.785-1.274.737-.08.045v-3.359l4.224-2.43a1.55 1.55 0 00.978-.387c.096-.096.177-.205.24-.326l2.697-1.561a4.1 4.1 0 01.067.75c.003 1.102-.389 1.982-1.176 2.64zm-1.448-2.277c.018-.115.027-.233.028-.35.023-.459-.129-.91-.424-1.262a1.374 1.374 0 00-.615-.393l3.75-2.164 1.644 1.646-4.383 2.523z"  /></Svg>;
}

PAC.DefaultColor = DefaultColor;
export default PAC;