import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function PhoneLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18.012 21.372l3.36-3.456-5.376-4.824-4.248 4.152A20.098 20.098 0 019.06 14.94a22.02 22.02 0 01-2.304-2.688l4.152-4.248-4.824-5.376-3.456 3.36c.72 3.576 2.856 7.056 5.592 9.792 2.76 2.76 6.192 4.896 9.792 5.592zm-14.064-15l2.088-2.016 3.24 3.6L6.06 11.22C5.1 9.708 4.356 8.076 3.948 6.372zM12.78 17.94l3.264-3.216 3.6 3.24-2.016 2.088c-1.704-.408-3.336-1.128-4.848-2.112z"  /></Svg>;
}

export default PhoneLight;