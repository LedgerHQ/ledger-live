import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#5F45BA";

function OXT({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M8.61 6.821a.824.824 0 11-1.418-.841.824.824 0 011.418.841zm-2.813-.366a.583.583 0 11-1.002-.594.583.583 0 011.002.594zm7.83 11.925a6.41 6.41 0 004.815-9.548 6.412 6.412 0 00-6.41-3.176c-.538.05-1.067.183-1.566.393-.581.285-.956.76-.956 1.395 0 .825.669 1.496 1.495 1.496.138 0 .616-.152.73-.19a3.455 3.455 0 013.809 5.457 3.455 3.455 0 01-5.559-.29c-.69-.903-.53-2.348-.531-2.367a1.498 1.498 0 00-2.942-.338 2.998 2.998 0 00-.046.541 6.41 6.41 0 007.16 6.627zM7.753 9.109a1.068 1.068 0 11-1.835-1.091 1.068 1.068 0 011.834 1.09"  /></Svg>;
}

OXT.DefaultColor = DefaultColor;
export default OXT;