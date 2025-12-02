import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#2ab8e6";
function THETA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M8.22 4.5h7.56l.72.745v13.51l-.72.745H8.22l-.72-.745V5.245zm.72 13.51h6.12V5.99H8.94zm5.35-3.878h-1.565v1.697h-1.413v-1.696H9.747v-1.462h4.544zm0-4.186v1.46H9.747v-1.46h1.565V8.249h1.413v1.697z" /></Svg>;
}
THETA.DefaultColor = DefaultColor;
export default THETA;