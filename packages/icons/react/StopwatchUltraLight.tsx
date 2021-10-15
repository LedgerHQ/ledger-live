import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StopwatchUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.54c4.368 0 7.92-3.552 7.92-7.92a7.875 7.875 0 00-2.04-5.28l1.392-1.368-.624-.624L17.28 7.74c-1.296-1.176-3-1.944-4.848-2.016V3.3H14.4v-.84H9.6v.84h1.992v2.424C7.416 5.94 4.08 9.396 4.08 13.62c0 4.368 3.552 7.92 7.92 7.92zm-7.08-7.92c0-3.912 3.192-7.08 7.08-7.08a7.078 7.078 0 017.08 7.08c0 3.888-3.168 7.08-7.08 7.08-3.888 0-7.08-3.192-7.08-7.08zm6.672.48c0 .24.168.408.408.408.24 0 .432-.168.432-.408V8.388h-.84V14.1z"  /></Svg>;
}

export default StopwatchUltraLight;