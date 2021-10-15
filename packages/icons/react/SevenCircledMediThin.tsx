import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SevenCircledMediThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.496 16.44h.528c.384-3.264 1.752-5.976 3.912-7.8V7.584h-6.36v.48h5.88v.36c-2.232 1.968-3.576 4.776-3.96 8.016zM5.76 20.88h12.48v-.48H5.76v.48zm0-17.28h12.48v-.48H5.76v.48z"  /></Svg>;
}

export default SevenCircledMediThin;