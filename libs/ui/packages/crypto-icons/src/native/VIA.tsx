import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#565656";

function VIA({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M8.35 9.972H6.004v-1.29h1.852L6.435 4.97l1.173-.47 2.663 6.95 3.45.023L16.392 4.5l1.174.47-1.422 3.713h1.852v1.29H15.65l-.578 1.507L18 11.5l-.008 1.29-3.412-.022L12 19.5l-2.592-6.766L6 12.712l.008-1.289 2.905.019-.563-1.47zm2.415 2.77L12 15.966l1.229-3.208-2.464-.015z"  /></Svg>;
}

VIA.DefaultColor = DefaultColor;
export default VIA;