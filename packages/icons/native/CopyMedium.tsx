import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CopyMedium({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M17.52 15.6h3.84V2.64L8.4 2.664V6.48h1.92V4.464l9.12-.024v9.36h-1.92v1.8zM2.64 21.36H15.6V8.4H2.64v12.96zm1.92-1.8V10.2h9.12v9.36H4.56z"  /></Svg>;
}

export default CopyMedium;