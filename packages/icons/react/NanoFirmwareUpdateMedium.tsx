import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoFirmwareUpdateMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 21.36h18.72v-6.84H2.664l-.024 6.84zm1.68-1.68l.024-3.48H10.2a3.307 3.307 0 00-.48 1.752c0 .624.168 1.224.48 1.728H4.32zM7.632 8.616L12 12.96l4.344-4.344-1.2-1.176-1.056 1.056c-.384.384-.792.816-1.176 1.248V2.64h-1.824v7.152c-.408-.456-.792-.888-1.2-1.296L8.808 7.44 7.632 8.616zm3.768 9.336c0-.96.792-1.752 1.68-1.752h6.6v3.48h-6.6c-.888 0-1.68-.792-1.68-1.728zm1.008 0c0 .48.408.888.888.888.48 0 .912-.408.912-.888a.927.927 0 00-.912-.912c-.48 0-.888.408-.888.912z"  /></Svg>;
}

export default NanoFirmwareUpdateMedium;