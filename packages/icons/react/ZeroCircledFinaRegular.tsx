import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledFinaRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M10.608 16.704c2.4 0 3.672-1.848 3.672-4.68 0-2.856-1.248-4.68-3.672-4.68-2.4 0-3.672 1.848-3.672 4.68s1.272 4.68 3.672 4.68zM4.152 21.24h6.456c5.184 0 9.24-4.224 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24H4.152v1.56h6.456c4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68H4.152v1.56zm4.392-8.352v-1.68c0-1.944.6-2.544 2.04-2.544.816 0 1.368.192 1.704.672l-3.72 4.2c-.024-.192-.024-.408-.024-.648zm.36 1.824l3.744-4.224c.024.216.024.456.024.72v1.68c0 1.92-.648 2.52-2.088 2.52-.816 0-1.344-.192-1.68-.696z"  /></Svg>;
}

export default ZeroCircledFinaRegular;