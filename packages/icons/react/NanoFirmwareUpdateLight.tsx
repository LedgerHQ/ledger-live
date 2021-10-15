import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function NanoFirmwareUpdateLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 21.24h18.72v-6.312H2.664L2.64 21.24zm1.08-1.08l.024-4.152h7.176a2.787 2.787 0 00-.888 2.064c0 .816.336 1.56.888 2.088h-7.2zM7.656 8.736L12 13.08l4.344-4.344-.768-.768-1.416 1.44a50.415 50.415 0 00-1.584 1.608V2.76h-1.152v8.28A103.323 103.323 0 009.84 9.408L8.4 7.968l-.744.768zm3.456 9.336c0-1.128.936-2.064 2.016-2.064h7.152v4.152h-7.152c-1.08 0-2.016-.936-2.016-2.088zm1.008.024c0 .624.528 1.152 1.152 1.152.648 0 1.176-.528 1.176-1.152 0-.648-.528-1.176-1.176-1.176-.624 0-1.152.528-1.152 1.176z"  /></Svg>;
}

export default NanoFirmwareUpdateLight;