import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#FEC807";

function ADD({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path fillRule="evenodd" clipRule="evenodd" d="M18.08 13.844h-3.696l-.66-1.98h4.35a.561.561 0 000-1.122h-4.707l-1.888-5.755a.805.805 0 00-1.59-.052L5.374 18.662a.708.708 0 000 .225.759.759 0 001.492.184l3.788-11.55 1.082 3.22H10.8a.561.561 0 000 1.123h1.32l.66 1.98h-1.98a.56.56 0 000 1.122h2.37l1.069 3.168h-5.67a.792.792 0 000 1.584h6.706a.752.752 0 00.752-.752.773.773 0 00-.072-.33l-1.208-3.67h3.3a.561.561 0 100-1.122h.033z"  /></Svg>;
}

ADD.DefaultColor = DefaultColor;
export default ADD;