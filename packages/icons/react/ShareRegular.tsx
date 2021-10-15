import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ShareRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.72 20.58h16.56v-9.12h-3.96v1.56h2.4v6H5.28v-6h2.4v-1.56H3.72v9.12zM7.656 7.764l.984.96 1.272-1.248c.432-.456.912-.936 1.344-1.416v10.32h1.488V6.012c.456.504.912.984 1.368 1.464l1.296 1.248.96-.96L12 3.42 7.656 7.764z"  /></Svg>;
}

export default ShareRegular;