import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SearchRegular({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M15.228 16.404l5.688 5.664 1.152-1.152-5.664-5.688a8.05 8.05 0 001.848-5.136c0-4.488-3.672-8.16-8.16-8.16-4.488 0-8.16 3.672-8.16 8.16 0 4.488 3.672 8.16 8.16 8.16a8.05 8.05 0 005.136-1.848zM3.492 10.092c0-3.648 2.976-6.6 6.6-6.6 3.648 0 6.6 2.952 6.6 6.6 0 3.624-2.952 6.6-6.6 6.6-3.624 0-6.6-2.976-6.6-6.6z"  /></Svg>;
}

export default SearchRegular;