import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ComputerLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.256 20.4h13.488c-.216-.624-.816-1.08-1.584-1.08h-2.352l-.648-3h5.4c.984 0 1.8-.816 1.8-1.8V5.4c0-.984-.816-1.8-1.8-1.8H4.44c-.984 0-1.8.816-1.8 1.8v9.12c0 .984.816 1.8 1.8 1.8h5.4l-.648 3H6.84c-.72 0-1.344.456-1.584 1.08zM3.84 14.496V5.424c0-.408.288-.696.696-.696h14.952c.408 0 .672.288.672.696v9.072c0 .408-.264.672-.672.672H4.536c-.408 0-.696-.264-.696-.672zm6.408 4.824l.648-3h2.208l.648 3h-3.504z"  /></Svg>;
}

export default ComputerLight;