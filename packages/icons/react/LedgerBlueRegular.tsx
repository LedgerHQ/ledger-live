import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LedgerBlueRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.22 22.2h12.72c1.104 0 1.92-.816 1.92-1.92V8.4h.84V5.04h-.84V3.72c0-1.104-.816-1.92-1.92-1.92H5.22c-1.104 0-1.92.816-1.92 1.92v16.56c0 1.104.816 1.92 1.92 1.92zm-.456-1.872V3.672c0-.264.168-.408.408-.408h12.816c.264 0 .408.144.408.408v16.656c0 .264-.144.408-.408.408H5.172c-.24 0-.408-.144-.408-.408zM6.42 19.08h10.32V4.92H6.42v14.16zm1.296-1.296V6.216h7.728v11.568H7.716z"  /></Svg>;
}

export default LedgerBlueRegular;