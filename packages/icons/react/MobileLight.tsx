import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MobileLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.08 22.32h9.84c.984 0 1.8-.816 1.8-1.8V3.48c0-.984-.816-1.8-1.8-1.8H7.08c-.984 0-1.8.816-1.8 1.8v17.04c0 .984.816 1.8 1.8 1.8zm-.6-1.824V3.504c0-.408.288-.696.696-.696h9.672c.408 0 .672.288.672.696v16.992c0 .408-.264.696-.672.696H7.176a.668.668 0 01-.696-.696zm4.248-1.8A1.28 1.28 0 0012 19.968c.696 0 1.248-.6 1.248-1.272A1.24 1.24 0 0012 17.448c-.72 0-1.272.552-1.272 1.248z"  /></Svg>;
}

export default MobileLight;