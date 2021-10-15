import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SixCircledMediLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.976 16.704c1.848 0 3.144-1.32 3.144-3.096s-1.296-3.096-3-3.096c-1.056 0-1.92.552-2.304 1.416h-.168C9.624 9.912 10.152 8.4 12 8.4c1.128 0 1.824.528 1.992 1.584h1.104c-.216-1.608-1.392-2.64-3.072-2.64-2.28 0-3.576 1.872-3.552 4.8.024 2.856 1.32 4.56 3.504 4.56zM5.76 21.12h12.48v-1.2H5.76v1.2zm0-17.04h12.48v-1.2H5.76v1.2zm4.152 9.696v-.408c0-1.128.672-1.824 1.968-1.824h.144c1.248 0 1.944.672 1.944 1.824v.408c0 1.152-.696 1.824-1.944 1.824h-.144c-1.296 0-1.968-.744-1.968-1.824z"  /></Svg>;
}

export default SixCircledMediLight;