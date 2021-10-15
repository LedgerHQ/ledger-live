import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DevicesAltMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M4.464 19.92h7.296v-1.68H9.912l.504-2.4h1.344v-1.8H3.888a.052.052 0 01-.048-.048V4.968c0-.024.024-.048.048-.048h14.784c.024 0 .048.024.048.048V6.12h1.92v-1.2c0-.984-.816-1.8-1.8-1.8H3.72c-.984 0-1.8.816-1.8 1.8v9.12c0 .984.816 1.8 1.8 1.8h5.088l-.504 2.4H6.36c-.96 0-1.776.744-1.896 1.68zm8.856-.84c0 .984.816 1.8 1.8 1.8h5.16c.984 0 1.8-.816 1.8-1.8V9.6c0-.984-.816-1.8-1.8-1.8h-5.16c-.984 0-1.8.816-1.8 1.8v9.48zm1.8.072V9.528c0-.024.024-.048.048-.048h5.064c.024 0 .048.024.048.048v9.624a.052.052 0 01-.048.048h-5.064a.052.052 0 01-.048-.048zm1.8-1.464c0 .432.336.792.792.792.432 0 .768-.36.768-.792a.758.758 0 00-.768-.768c-.456 0-.792.336-.792.768z"  /></Svg>;
}

export default DevicesAltMedium;