import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FreezeThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.76 21.36h.48v-4.08l2.424 2.496.336-.336-2.76-2.76-.024-4.152 5.88 5.904.336-.336-5.904-5.88 4.152.024L19.44 15l.336-.336-2.496-2.424h4.08v-.48h-4.08l2.496-2.424L19.44 9l-2.76 2.76-4.152.024 5.904-5.88-.336-.336-5.88 5.904.024-4.152L15 4.56l-.336-.336L12.24 6.72V2.64h-.48v4.08L9.336 4.224 9 4.56l2.76 2.76.024 4.152-5.88-5.904-.336.336 5.904 5.88-4.152-.024L4.56 9l-.336.336L6.72 11.76H2.64v.48h4.08l-2.496 2.424.336.336 2.76-2.76 4.152-.024-5.904 5.88.336.336 5.88-5.904-.024 4.152L9 19.44l.336.336 2.424-2.496v4.08z"  /></Svg>;
}

export default FreezeThin;