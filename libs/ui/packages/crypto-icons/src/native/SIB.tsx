import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#057BC1";

function SIB({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M12 3a9 9 0 100 18 9 9 0 000-18zm3.132 12.395h-.366v2.05h-1.23v-2.05h-1.873v-.761h1.903v-1.376a4.83 4.83 0 01-3.249.527c-.615-.146-1.23-.482-1.551-1.039a3.44 3.44 0 01-.44-1.785V7.712h1.245v3.366c.029.732.497 1.463 1.215 1.683.944.217 1.935.06 2.765-.44 0-1.024-.015-2.56 0-4.609h1.258v6.923h.323v.76z"  /></Svg>;
}

SIB.DefaultColor = DefaultColor;
export default SIB;