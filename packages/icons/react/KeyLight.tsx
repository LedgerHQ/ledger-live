import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function KeyLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8.076 21.24l.864-.912-2.448-2.424 1.584-1.584 2.424 2.448.912-.912-2.448-2.424 4.344-4.344c.744.552 1.68.888 2.712.888 2.616 0 4.68-2.064 4.68-4.608 0-2.544-2.064-4.608-4.68-4.608-2.616 0-4.656 2.064-4.656 4.608 0 1.08.36 2.088 1.008 2.88L3.3 19.296l.912.912 1.392-1.416 2.472 2.448zm4.536-13.872A3.39 3.39 0 0116.02 3.96a3.39 3.39 0 013.408 3.408 3.39 3.39 0 01-3.408 3.408 3.39 3.39 0 01-3.408-3.408z"  /></Svg>;
}

export default KeyLight;