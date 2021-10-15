import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledMediRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 16.704c2.4 0 3.672-1.848 3.672-4.68 0-2.856-1.248-4.68-3.672-4.68-2.4 0-3.672 1.848-3.672 4.68S9.6 16.704 12 16.704zM5.76 21.24h12.48v-1.56H5.76v1.56zm0-16.92h12.48V2.76H5.76v1.56zm4.176 8.568v-1.68c0-1.944.6-2.544 2.04-2.544.816 0 1.368.192 1.704.672l-3.72 4.2c-.024-.192-.024-.408-.024-.648zm.36 1.824l3.744-4.224c.024.216.024.456.024.72v1.68c0 1.92-.648 2.52-2.088 2.52-.816 0-1.344-.192-1.68-.696z"  /></Svg>;
}

export default ZeroCircledMediRegular;