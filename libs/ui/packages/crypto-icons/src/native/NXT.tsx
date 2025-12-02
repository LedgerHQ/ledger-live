import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#008fbb";
function NXT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillRule="evenodd" d="M19.562 12.625c-.38 0-.689-.28-.689-.625v-.626h-3.459c-.38 0-.688-.28-.688-.624 0-.345.308-.625.688-.625h4.147c.38 0 .689.28.689.625V12c0 .345-.308.625-.689.625m-3.412 0h1.376c.38 0 .689.28.689.624 0 .345-.308.626-.689.626h-2.112a.74.74 0 01-.317-.07l-4.014-2.43H9.926c-.38 0-.688-.28-.688-.625s.307-.625.688-.625h1.377c.148 0 .285.043.398.116l3.924 2.385zm-4.847 0c.38 0 .688.28.688.624 0 .345-.308.626-.688.626H9.926a.74.74 0 01-.317-.07l-4.014-2.43H4.439c-.38 0-.689-.28-.689-.625s.308-.625.689-.625h1.376c.14 0 .28.04.398.116l3.924 2.385zm-6.865 0h1.377c.38 0 .688.28.688.625s-.308.625-.688.625H4.439c-.38 0-.689-.28-.689-.625s.308-.625.689-.625" clipRule="evenodd" /></Svg>;
}
NXT.DefaultColor = DefaultColor;
export default NXT;