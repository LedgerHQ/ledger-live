import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MobileMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6.72 22.32h10.56c.984 0 1.8-.816 1.8-1.8V3.48c0-.984-.816-1.8-1.8-1.8H6.72c-.984 0-1.8.816-1.8 1.8v17.04c0 .984.816 1.8 1.8 1.8zm.12-1.848V3.528c0-.024.024-.048.048-.048h10.224c.024 0 .048.024.048.048v16.944a.052.052 0 01-.048.048H6.888a.052.052 0 01-.048-.048zm3.888-2.544A1.28 1.28 0 0012 19.2c.696 0 1.248-.6 1.248-1.272A1.24 1.24 0 0012 16.68c-.72 0-1.272.552-1.272 1.248z"  /></Svg>;
}

export default MobileMedium;