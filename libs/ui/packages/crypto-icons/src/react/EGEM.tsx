import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#4a4ab6";
function EGEM({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M12 4.068l6.346 10.153L12 19.932l-6.346-5.711zm-1.694 9.444H8.102l3.448-5.517v3.495zm.138.9H8.407l3.143 2.828v-1.861zm2.006.957v1.871l3.143-2.828h-2.049zm1.233-1.857h2.215L12.45 7.994v3.513z" clipRule="evenodd" /></Svg>;
}
EGEM.DefaultColor = DefaultColor;
export default EGEM;