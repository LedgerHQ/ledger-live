import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CloseRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M20.184 18.984L13.2 12l6.984-6.984-1.248-1.152L12 10.8 5.064 3.864 3.816 5.016 10.8 12l-6.984 6.984 1.248 1.152L12 13.2l6.936 6.936 1.248-1.152z"  /></Svg>;
}

export default CloseRegular;