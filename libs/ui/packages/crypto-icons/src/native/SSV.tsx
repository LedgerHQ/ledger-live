import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#1BA5F8";

function SSV({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}><Path opacity={0.62} d="M177.641 404.919l64.585-79.604c6.746-8.316 19.435-8.316 26.181 0l64.584 79.604a16.857 16.857 0 010 21.241l-64.584 79.604c-6.746 8.315-19.435 8.315-26.181 0l-64.585-79.604a16.86 16.86 0 010-21.241z"  /><Path fillRule="evenodd" clipRule="evenodd" d="M242.226 6.236L177.641 85.84a16.86 16.86 0 000 21.242l64.585 79.604c6.746 8.315 19.435 8.315 26.181 0l64.584-79.604a16.858 16.858 0 000-21.242L268.407 6.236c-6.746-8.315-19.435-8.315-26.181 0zM76.766 210.257l64.585-79.604c6.746-8.315 19.435-8.315 26.181 0l64.584 79.604a16.857 16.857 0 010 21.241l-64.584 79.604c-6.746 8.315-19.435 8.315-26.181 0l-64.585-79.604a16.857 16.857 0 010-21.241zm201.813 0l64.584-79.604c6.747-8.315 19.435-8.315 26.181 0l64.585 79.604a16.857 16.857 0 010 21.241l-64.585 79.604c-6.746 8.315-19.434 8.315-26.181 0l-64.584-79.604a16.857 16.857 0 010-21.241z"  /></Svg>;
}

SSV.DefaultColor = DefaultColor;
export default SSV;