import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CopyLight({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M17.28 15.36h3.84V2.88l-12.48.024V6.72h1.2V4.032h10.08v10.176h-2.64v1.152zm-14.4 5.76h12.48V8.64H2.88v12.48zm1.2-1.152v-10.2h10.08v10.2H4.08z"  /></Svg>;
}

export default CopyLight;