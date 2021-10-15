import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CircledUpRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.256 9.36v7.68h1.488V9.312c.48.528.936 1.008 1.416 1.488l1.248 1.224.96-.96L12 6.72l-4.344 4.344.984.96L9.864 10.8c.456-.456.936-.936 1.392-1.44zM2.76 12c0 5.16 4.08 9.24 9.24 9.24 5.184 0 9.24-4.2 9.24-9.24 0-5.16-4.08-9.24-9.24-9.24S2.76 6.84 2.76 12zm1.56 0c0-4.32 3.384-7.68 7.68-7.68 4.32 0 7.68 3.36 7.68 7.68 0 4.176-3.36 7.68-7.68 7.68-4.296 0-7.68-3.384-7.68-7.68z"  /></Svg>;
}

export default CircledUpRegular;