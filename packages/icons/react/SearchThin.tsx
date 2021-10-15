import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SearchThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M15.444 15.804l5.904 5.88.336-.336-5.88-5.904a7.808 7.808 0 002.112-5.328c0-4.296-3.504-7.8-7.8-7.8-4.296 0-7.8 3.504-7.8 7.8 0 4.296 3.504 7.8 7.8 7.8a7.808 7.808 0 005.328-2.112zM2.796 10.116c0-4.032 3.288-7.32 7.32-7.32s7.32 3.288 7.32 7.32-3.288 7.32-7.32 7.32-7.32-3.288-7.32-7.32z"  /></Svg>;
}

export default SearchThin;