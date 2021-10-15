import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function SearchUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M15.384 15.984l5.808 5.832.624-.624-5.832-5.808a7.875 7.875 0 002.04-5.28c0-4.368-3.552-7.92-7.92-7.92s-7.92 3.552-7.92 7.92 3.552 7.92 7.92 7.92a7.875 7.875 0 005.28-2.04zm-12.36-5.88c0-3.912 3.192-7.08 7.08-7.08a7.078 7.078 0 017.08 7.08c0 3.888-3.168 7.08-7.08 7.08-3.888 0-7.08-3.192-7.08-7.08z"  /></Svg>;
}

export default SearchUltraLight;