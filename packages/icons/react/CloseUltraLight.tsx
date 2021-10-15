import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function CloseUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.872 19.248L12.624 12l7.248-7.248-.624-.624L12 11.376 4.752 4.128l-.624.624L11.376 12l-7.248 7.248.624.624L12 12.624l7.248 7.248.624-.624z"  /></Svg>;
}

export default CloseUltraLight;