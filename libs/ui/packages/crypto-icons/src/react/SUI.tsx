import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#4da2ff";
function SUI({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} fill={color} viewBox="0 0 512 512"><path  fillRule="evenodd" d="M346.1 223.9c15.6 19.6 25 44.5 25 71.5s-9.6 52.6-25.7 72.4l-1.4 1.7-.4-2.2c-.3-1.8-.7-3.7-1.1-5.6-8-35.3-34.2-65.6-77.4-90.2-29.1-16.5-45.8-36.4-50.2-59-2.8-14.6-.7-29.3 3.3-41.9 4.1-12.6 10.1-23.1 15.2-29.4l16.8-20.5c2.9-3.6 8.5-3.6 11.4 0zm26.5-20.5L260.2 66c-2.1-2.6-6.2-2.6-8.3 0L139.4 203.4l-.4.5c-20.6 25.7-33 58.3-33 93.8 0 82.7 67.2 149.8 150 149.8s150-67.1 150-149.8c0-35.5-12.4-68.1-33.1-93.8zm-206.3 20.1l10-12.3.3 2.3q.3 2.7.9 5.4c6.5 34.1 29.8 62.6 68.6 84.6 33.8 19.2 53.4 41.3 59.1 65.6 2.4 10.1 2.8 20.1 1.8 28.8l-.1.5-.5.2c-15.2 7.4-32.4 11.6-50.5 11.6-63.5 0-115-51.4-115-114.8 0-27.2 9.5-52.3 25.4-71.9" clipRule="evenodd" /></Svg>;
}
SUI.DefaultColor = DefaultColor;
export default SUI;