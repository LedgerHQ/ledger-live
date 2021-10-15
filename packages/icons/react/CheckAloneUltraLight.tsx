import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CheckAloneUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.088 12.732L8.4 19.044 21.912 5.58l-.624-.624L8.4 17.796l-5.688-5.688-.624.624z"  /></Svg>;
}

export default CheckAloneUltraLight;