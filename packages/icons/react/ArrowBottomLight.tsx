import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowBottomLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.372l6.624-6.648-.744-.768-3.264 3.288c-.672.672-1.368 1.368-2.04 2.064V2.628h-1.152v16.68a165.323 165.323 0 00-2.016-2.064l-3.264-3.288-.768.768L12 21.372z"  /></Svg>;
}

export default ArrowBottomLight;