import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiltersLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M5.904 21.36v-4.608H8.4v-1.2H2.16v1.2h2.496v4.608h1.248zm-1.248-7.728h1.248V2.64H4.656v10.992zM8.88 8.4h6.24V7.2h-2.496V2.64h-1.248V7.2H8.88v1.2zm2.496 12.96h1.248V10.32h-1.248v11.04zm4.224-4.608h2.496v4.608h1.248v-4.608h2.496v-1.2H15.6v1.2zm2.496-3.12h1.248V2.64h-1.248v10.992z"  /></Svg>;
}

export default FiltersLight;