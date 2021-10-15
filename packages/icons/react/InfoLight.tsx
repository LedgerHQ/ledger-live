import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function InfoLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.312 17.04h5.4v-1.032h-2.016v-5.784H9.552v1.008h2.016v4.776H9.312v1.032zM2.88 12c0 5.088 4.032 9.12 9.12 9.12 5.112 0 9.12-4.152 9.12-9.12 0-5.088-4.032-9.12-9.12-9.12-5.088 0-9.12 4.032-9.12 9.12zm1.2 0c0-4.44 3.48-7.92 7.92-7.92 4.44 0 7.92 3.48 7.92 7.92 0 4.32-3.48 7.92-7.92 7.92-4.44 0-7.92-3.48-7.92-7.92zm7.056-3.504h1.872V6.624h-1.872v1.872z"  /></Svg>;
}

export default InfoLight;