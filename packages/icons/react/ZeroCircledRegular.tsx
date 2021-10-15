import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ZeroCircledRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.24c5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12s4.08 9.24 9.24 9.24zM4.32 12c0-4.32 3.384-7.68 7.68-7.68 4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68-4.296 0-7.68-3.384-7.68-7.68zm4.008.024c0 2.832 1.272 4.68 3.672 4.68 2.4 0 3.672-1.848 3.672-4.68 0-2.856-1.248-4.68-3.672-4.68-2.4 0-3.672 1.848-3.672 4.68zm1.608.864v-1.68c0-1.944.6-2.544 2.04-2.544.816 0 1.368.192 1.704.672l-3.72 4.2c-.024-.192-.024-.408-.024-.648zm.36 1.824l3.744-4.224c.024.216.024.456.024.72v1.68c0 1.92-.648 2.52-2.088 2.52-.816 0-1.344-.192-1.68-.696z"  /></Svg>;
}

export default ZeroCircledRegular;