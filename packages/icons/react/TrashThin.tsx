import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function TrashThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.56 21.36h8.88c.984 0 1.8-.816 1.8-1.8V8.4h-.48v11.16c0 .792-.528 1.32-1.32 1.32H7.56c-.792 0-1.32-.528-1.32-1.32V8.4h-.48v11.16c0 .984.816 1.8 1.8 1.8zM3.84 6.624h16.32v-.48h-4.44V4.176c0-.864-.672-1.536-1.536-1.536H9.816c-.864 0-1.536.672-1.536 1.536v1.968H3.84v.48zm4.92-.48V4.176c0-.672.384-1.056 1.056-1.056h4.368c.672 0 1.056.384 1.056 1.056v1.968H8.76zM9.84 17.64h.48V9.72h-.48v7.92zm3.84 0h.48V9.72h-.48v7.92z"  /></Svg>;
}

export default TrashThin;