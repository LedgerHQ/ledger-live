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
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  fillOpacity={0.4} d="M8.25 16.59L12 14.473V18.7zm0-6.75L12 7.723v4.227z" /><Path  fillOpacity={0.7} d="M19.5 14.423l-3.75 2.164v-4.264zm0-6.75l-3.75 2.164V5.572z" /><Path  fillOpacity={0.8} d="M8.25 16.587v-4.262L12 14.477zm0-6.75V5.575L12 7.727z" /><Path  d="M15.75 16.587L12 14.478l3.75-2.155zm0-6.75L12 7.728l3.75-2.156z" /><Path  fillOpacity={0.6} d="M15.75 16.587L12 18.701v-4.223zm0-6.75L12 11.951V7.728z" /><Path  fillOpacity={0.5} d="M8.25 12.326v4.262L4.5 14.424zm0-6.75v4.262L4.5 7.674z" /><Path  fillOpacity={0.4} d="M8.25 16.453L12 14.338v4.226zm0-6.75L12 7.588v4.226z" /><Path  fillOpacity={0.7} d="M19.5 14.286l-3.75 2.165v-4.265zm0-6.75l-3.75 2.165V5.436z" /><Path  d="M8.25 16.45v-4.262L12 14.341zm0-6.75V5.439L12 7.591zm7.5 6.75L12 14.343l3.75-2.156zm0-6.75L12 7.592l3.75-2.156z" /><Path  fillOpacity={0.6} d="M15.75 16.45L12 18.565v-4.222zm0-6.75L12 11.815V7.592z" /><Path  fillOpacity={0.5} d="M8.25 12.189v4.262L4.5 14.287zm0-6.75v4.262L4.5 7.538z" /></Svg>;
}
ELA.DefaultColor = DefaultColor;
export default ELA;