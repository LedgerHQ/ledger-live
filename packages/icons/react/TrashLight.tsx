import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TrashLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.2 21.36h9.6c.984 0 1.8-.816 1.8-1.8V9h-1.2v10.536c0 .408-.288.672-.672.672H7.296c-.408 0-.696-.264-.696-.672V9H5.4v10.56c0 .984.816 1.8 1.8 1.8zM3.72 7.32h16.56V6.168h-4.32V4.176c0-.864-.672-1.536-1.536-1.536H9.576c-.864 0-1.536.672-1.536 1.536v1.992H3.72V7.32zm5.4-1.152V4.272c0-.336.216-.552.552-.552h4.656c.336 0 .552.216.552.552v1.896H9.12zM9.504 17.4h1.152v-7.08H9.504v7.08zm3.84 0h1.152v-7.08h-1.152v7.08z"  /></Svg>;
}

export default TrashLight;