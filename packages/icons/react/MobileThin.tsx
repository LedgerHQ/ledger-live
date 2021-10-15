import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function MobileThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.44 22.32h9.12c.984 0 1.8-.816 1.8-1.8V3.48c0-.984-.816-1.8-1.8-1.8H7.44c-.984 0-1.8.816-1.8 1.8v17.04c0 .984.816 1.8 1.8 1.8zm-1.32-1.8V3.48c0-.792.528-1.32 1.32-1.32h9.12c.792 0 1.32.528 1.32 1.32v17.04c0 .792-.528 1.32-1.32 1.32H7.44c-.792 0-1.32-.528-1.32-1.32zm4.608-1.032A1.28 1.28 0 0012 20.76c.696 0 1.248-.6 1.248-1.272A1.24 1.24 0 0012 18.24c-.72 0-1.272.552-1.272 1.248zm.48 0c0-.432.336-.768.792-.768.432 0 .768.336.768.768a.779.779 0 01-.768.792.784.784 0 01-.792-.792z"  /></Svg>;
}

export default MobileThin;