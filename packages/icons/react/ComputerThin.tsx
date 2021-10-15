import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ComputerThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.328 20.4h13.344a1.934 1.934 0 00-1.272-.48h-2.784l-.768-3.6h5.712c.984 0 1.8-.816 1.8-1.8V5.4c0-.984-.816-1.8-1.8-1.8H4.44c-.984 0-1.8.816-1.8 1.8v9.12c0 .984.816 1.8 1.8 1.8h5.712l-.768 3.6H6.6c-.48 0-.936.192-1.272.48zM3.12 14.52V5.4c0-.792.528-1.32 1.32-1.32h15.12c.792 0 1.32.528 1.32 1.32v9.12c0 .792-.528 1.32-1.32 1.32H4.44c-.792 0-1.32-.528-1.32-1.32zm6.768 5.4l.768-3.6h2.688l.768 3.6H9.888z"  /></Svg>;
}

export default ComputerThin;