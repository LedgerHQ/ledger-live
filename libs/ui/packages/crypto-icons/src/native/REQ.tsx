import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#00E6A0";

function REQ({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M17.102 5.657a.49.49 0 01.358.144l-.004-.005c.074.074.122.17.138.273l.006.078-.005 2.563c0 .337-.133.66-.372.898l-3.18 3.17 3.403 3.393a1.266 1.266 0 11-1.787 1.795l-4.302-4.288a1.264 1.264 0 010-1.796l3.767-3.759H8.75v8.917a1.268 1.268 0 01-1.288 1.288l-.128-.004a1.272 1.272 0 01-1.161-1.284V7.042c0-.8.572-1.385 1.347-1.385h9.582z"  /></Svg>;
}

REQ.DefaultColor = DefaultColor;
export default REQ;