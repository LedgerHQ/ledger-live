import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fff";

function ELA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M8.25 16.59L12 14.473v4.227l-3.75-2.112zm0-6.75L12 7.723v4.226L8.25 9.84z"  fillOpacity={0.4} /><Path d="M19.5 14.422l-3.75 2.165v-4.264l3.75 2.1zm0-6.75l-3.75 2.165V5.572l3.75 2.1z"  fillOpacity={0.7} /><Path d="M8.25 16.587v-4.262L12 14.477l-3.75 2.11zm0-6.75V5.575L12 7.727l-3.75 2.11z"  fillOpacity={0.8} /><Path d="M15.75 16.587L12 14.478l3.75-2.155v4.264zm0-6.75L12 7.728l3.75-2.156v4.265z"  /><Path d="M15.75 16.587L12 18.701v-4.223l3.75 2.109zm0-6.75L12 11.951V7.728l3.75 2.109z"  fillOpacity={0.6} /><Path d="M8.25 12.325v4.263L4.5 14.424l3.75-2.098zm0-6.75v4.263L4.5 7.674l3.75-2.099z"  fillOpacity={0.5} /><Path d="M8.25 16.453L12 14.338v4.226l-3.75-2.111zm0-6.75L12 7.588v4.226L8.25 9.703z"  fillOpacity={0.4} /><Path d="M19.5 14.286l-3.75 2.165v-4.265l3.75 2.1zm0-6.75l-3.75 2.165V5.436l3.75 2.1z"  fillOpacity={0.7} /><Path d="M8.25 16.45v-4.262L12 14.341l-3.75 2.11zm0-6.75V5.439L12 7.591 8.25 9.7zM15.75 16.45L12 14.343l3.75-2.156v4.265zm0-6.75L12 7.592l3.75-2.156V9.7z"  /><Path d="M15.75 16.45L12 18.565v-4.223l3.75 2.11zm0-6.75L12 11.815V7.592L15.75 9.7z"  fillOpacity={0.6} /><Path d="M8.25 12.189v4.262L4.5 14.287l3.75-2.098zm0-6.75v4.262L4.5 7.538l3.75-2.099z"  fillOpacity={0.5} /></Svg>;
}

ELA.DefaultColor = DefaultColor;
export default ELA;