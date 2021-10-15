import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoImportRegular({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M2.64 9.276h18.72V2.7H2.664L2.64 9.276zm1.392-1.392V4.068h6.528c-.432.504-.672 1.176-.696 1.92.024.72.264 1.392.696 1.896H4.032zm3.6 9.072L12 21.3l4.344-4.344-.984-.96-1.248 1.224-1.368 1.44v-7.68h-1.488v7.704a40.134 40.134 0 00-1.392-1.464l-1.248-1.224-.984.96zm3.624-10.968c0-1.056.864-1.92 1.848-1.92h6.888v3.816h-6.888c-.984 0-1.848-.864-1.848-1.896zm1.008 0a1.04 1.04 0 001.032 1.032c.552 0 1.032-.48 1.032-1.032a1.04 1.04 0 00-1.032-1.032c-.576 0-1.032.456-1.032 1.032z"  /></Svg>;
}

export default NanoImportRegular;