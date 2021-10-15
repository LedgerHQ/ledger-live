import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoFirmwareUpdateRegular({
  size = 16,
  color = "palette.neutral.c100"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M2.64 21.3h18.72v-6.576H2.664L2.64 21.3zm1.392-1.392v-3.792h6.528c-.432.504-.672 1.176-.696 1.896.024.72.264 1.392.696 1.896H4.032zm3.6-11.232L12 13.02l4.344-4.344-.984-.96-1.248 1.224-1.368 1.44V2.7h-1.488v7.704A40.092 40.092 0 009.864 8.94L8.616 7.716l-.984.96zm3.624 9.336c0-1.032.864-1.896 1.848-1.896h6.888v3.792h-6.888c-.984 0-1.848-.864-1.848-1.896zm1.008 0c0 .576.456 1.032 1.032 1.032a1.04 1.04 0 001.032-1.032 1.04 1.04 0 00-1.032-1.032c-.576 0-1.032.456-1.032 1.032z"  /></Svg>;
}

export default NanoFirmwareUpdateRegular;