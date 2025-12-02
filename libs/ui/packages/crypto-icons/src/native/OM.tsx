import * as React from "react";
import  { G, Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#f8b994";
function OM({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 400 400" fill={color}><G ><Path d="M187.8 86.8C181.3 93.2 176 99 176 99.5c0 .6 5.4 6.4 12 13l12 12 12.5-12.5L225 99.5l-12-12c-6.6-6.6-12.3-12.1-12.8-12.2-.4-.2-6 5-12.4 11.5" /><Path d="M95.2 113.7l-12.1 12.8-.1 99.2V325h35v-81.6c0-48.7.4-81.4.9-81.2.5.1 9.3 8.4 19.6 18.3s21.3 19.6 24.4 21.6c22.3 14.2 52.5 14.3 74.2.1 4.5-2.9 14.8-12 25.7-22.7 10-9.7 18.2-17.3 18.2-16.9 0 .5.1 37.1.3 81.4l.2 80.5 17.8.3c13.8.2 17.7 0 17.7-1 0-.7.1-45.5.2-99.6l.2-98.3-11.9-11.9c-6.6-6.6-12.5-12-13.2-12s-1.6.6-2 1.2c-.6 1.1-29 28.7-65.8 64.2-7.8 7.4-14.2 10.1-24.5 10.1-13 0-15.5-1.7-48.7-34-15.3-14.8-31.4-30.5-35.9-34.7l-8.1-7.8z" /></G></Svg>;
}
OM.DefaultColor = DefaultColor;
export default OM;