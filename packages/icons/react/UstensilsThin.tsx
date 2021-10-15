import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function UstensilsThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M7.764 11.52v10.32h.48V11.52c1.896-.144 3.36-1.728 3.36-3.6V2.4h-.48v5.52c0 1.656-1.224 3-2.88 3.12V2.4h-.48v8.64a3.102 3.102 0 01-2.88-3.12V2.4h-.48v5.52c0 1.872 1.488 3.456 3.36 3.6zm6.552 5.28h4.8v5.04h.48V2.16a5.25 5.25 0 00-5.28 5.28v9.36zm.48-.48V7.44c0-2.592 1.824-4.56 4.32-4.776V16.32h-4.32z"  /></Svg>;
}

export default UstensilsThin;