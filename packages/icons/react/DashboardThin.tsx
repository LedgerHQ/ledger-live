import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DashboardThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.6 19.92h16.8v-.48H4.08V4.08H3.6v15.84zm3.672-2.88h.48V11.4h-.48v5.64zm3.936 0h.48V6.576h-.48V17.04zm3.936 0h.48V8.976h-.48v8.064zm3.936 0h.48V4.2h-.48v12.84z"  /></Svg>;
}

export default DashboardThin;