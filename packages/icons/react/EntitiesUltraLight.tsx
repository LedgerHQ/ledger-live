import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function EntitiesUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M1.68 21.36h6v-6H5.064v-2.976h6.552v2.976H9v6h6v-6h-2.616v-2.976h6.552v2.976H16.32v6h6v-6h-2.616v-3.744h-7.32V8.64H15v-6H9v6h2.616v2.976h-7.32v3.744H1.68v6zm.792-.768v-4.464h4.44v4.464h-4.44zm7.32 0v-4.464h4.44v4.464h-4.44zm0-12.72V3.408h4.44v4.464h-4.44zm7.32 12.72v-4.464h4.44v4.464h-4.44z"  /></Svg>;
}

export default EntitiesUltraLight;