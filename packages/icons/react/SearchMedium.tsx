import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SearchMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M15.168 16.608L20.76 22.2l1.44-1.44-5.592-5.592a8.215 8.215 0 001.752-5.088c0-4.56-3.72-8.28-8.28-8.28-4.56 0-8.28 3.72-8.28 8.28 0 4.56 3.72 8.28 8.28 8.28 1.92 0 3.672-.648 5.088-1.752zM3.72 10.08c0-3.504 2.856-6.36 6.36-6.36 3.504 0 6.36 2.856 6.36 6.36 0 3.504-2.856 6.36-6.36 6.36-3.504 0-6.36-2.856-6.36-6.36z"  /></Svg>;
}

export default SearchMedium;