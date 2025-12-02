import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#b49ffc";
function EMC({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M6 6v2.4h4.8v2.4H6v2.4h7.2V8.4h2.4v7.2H6V18h12V6z" clipRule="evenodd" /></Svg>;
}
EMC.DefaultColor = DefaultColor;
export default EMC;