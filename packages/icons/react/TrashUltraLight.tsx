import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TrashUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.38 21.36h9.24c.984 0 1.8-.816 1.8-1.8V8.688h-.84v10.848c0 .6-.408 1.008-1.008 1.008H7.404c-.6 0-.984-.408-.984-1.008V8.688h-.84V19.56c0 .984.816 1.8 1.8 1.8zm-3.6-14.4h16.44v-.792h-4.392V4.176c0-.864-.672-1.536-1.536-1.536H9.684c-.864 0-1.536.672-1.536 1.536v1.992H3.78v.792zm5.16-.792V4.224c0-.504.288-.816.792-.816h4.512c.504 0 .816.312.816.816v1.944H8.94zm.72 11.352h.816v-7.512H9.66v7.512zm3.84 0h.816v-7.512H13.5v7.512z"  /></Svg>;
}

export default TrashUltraLight;