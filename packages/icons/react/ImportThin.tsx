import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ImportThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 20.16h17.76v-6.72h-.48v6.24H3.6v-6.24h-.48v6.72zm4.536-7.704L12 16.8l4.344-4.344-.336-.336-1.872 1.872-1.896 1.896V3.84h-.48v12.048l-1.896-1.896-1.872-1.872-.336.336z"  /></Svg>;
}

export default ImportThin;