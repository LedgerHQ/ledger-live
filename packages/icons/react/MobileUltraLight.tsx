import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MobileUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.26 22.32h9.48c.984 0 1.8-.816 1.8-1.8V3.48c0-.984-.816-1.8-1.8-1.8H7.26c-.984 0-1.8.816-1.8 1.8v17.04c0 .984.816 1.8 1.8 1.8zm-.96-1.8V3.48c0-.6.384-.984.984-.984h9.408c.6 0 1.008.384 1.008.984v17.04c0 .6-.408.984-1.008.984H7.284c-.6 0-.984-.384-.984-.984zm4.416-1.416a1.28 1.28 0 001.272 1.272c.696 0 1.248-.6 1.248-1.272a1.24 1.24 0 00-1.248-1.248c-.72 0-1.272.552-1.272 1.248zm.672 0c0-.336.264-.576.6-.576.336 0 .576.24.576.576 0 .312-.24.576-.576.576a.59.59 0 01-.6-.576z"  /></Svg>;
}

export default MobileUltraLight;