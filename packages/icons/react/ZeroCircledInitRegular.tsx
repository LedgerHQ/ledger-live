import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledInitRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13.392 16.704c2.4 0 3.672-1.848 3.672-4.68 0-2.856-1.248-4.68-3.672-4.68-2.4 0-3.672 1.848-3.672 4.68s1.272 4.68 3.672 4.68zM4.152 12c0 5.16 4.08 9.24 9.24 9.24h6.456v-1.56h-6.456c-4.296 0-7.68-3.384-7.68-7.68 0-4.2 3.384-7.68 7.68-7.68h6.456V2.76h-6.456c-5.184 0-9.24 4.2-9.24 9.24zm7.176.888v-1.68c0-1.944.6-2.544 2.04-2.544.816 0 1.368.192 1.704.672l-3.72 4.2c-.024-.192-.024-.408-.024-.648zm.36 1.824l3.744-4.224c.024.216.024.456.024.72v1.68c0 1.92-.648 2.52-2.088 2.52-.816 0-1.344-.192-1.68-.696z"  /></Svg>;
}

export default ZeroCircledInitRegular;