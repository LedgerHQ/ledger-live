import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#4A4AB6";

function EGEM({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path fillRule="evenodd" clipRule="evenodd" d="M12 4.068l6.346 10.153L12 19.932l-6.346-5.711L12 4.068zm-1.694 9.444H8.102l3.448-5.517v3.495l-1.244 2.021zm.138.9H8.407l3.143 2.828v-1.861l-1.106-.967zm2.006.957v1.871l3.143-2.828h-2.049l-1.094.957zm1.233-1.857h2.215L12.45 7.994v3.513l1.233 2.004z"  /></Svg>;
}

EGEM.DefaultColor = DefaultColor;
export default EGEM;