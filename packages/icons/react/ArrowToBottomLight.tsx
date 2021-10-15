import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function ArrowToBottomLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 17.16l5.496-5.496-.744-.768-2.232 2.232-1.944 1.968V3.24h-1.152v11.856c-.624-.672-1.296-1.344-1.92-1.968l-2.232-2.232-.768.768L12 17.16zm-8.4 3.6h16.8v-1.2H3.6v1.2z"  /></Svg>;
}

export default ArrowToBottomLight;