import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#30367A";

function UTK({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M10.765 16.724V6.77h-2.89V4.5h8.25v2.271h-2.89v9.953h-2.47zM10.1 19.5c-1.492 0-2.198-.717-2.198-2.233V7.421h2.17v9.744c0 .24.08.32.315.32h3.254c.236 0 .315-.08.315-.32V7.422h2.169v9.845c0 1.516-.707 2.233-2.197 2.233h-3.829z"  /></Svg>;
}

UTK.DefaultColor = DefaultColor;
export default UTK;