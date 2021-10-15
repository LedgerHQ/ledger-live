import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FourCircledMediThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.08 11.664v2.184h-4.2l3.84-5.784h.36v3.6zM5.76 20.88h12.48v-.48H5.76v.48zm0-17.28h12.48v-.48H5.76v.48zm2.616 10.728h4.704v2.136h.48v-2.136h1.512v-.48H13.56V7.584h-1.08l-4.104 6.168v.576z"  /></Svg>;
}

export default FourCircledMediThin;