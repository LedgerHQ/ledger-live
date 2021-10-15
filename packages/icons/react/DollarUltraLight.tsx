import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DollarUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.748 22.32h.864V20.4c2.856-.168 5.304-1.872 5.304-4.728 0-2.448-1.752-3.792-4.392-4.152l-.912-.12V4.488c2.592.144 4.032 1.776 4.056 4.512h.984c-.048-3.096-2.04-5.208-5.04-5.376V1.68h-.864v1.944c-2.568.144-5.016 1.656-5.016 4.44 0 2.304 1.512 3.648 4.056 3.984l.96.12v7.344c-3-.144-4.632-1.944-4.68-5.016h-.984c.072 3.504 2.304 5.712 5.664 5.88v1.944zM7.668 8.088v-.12c0-2.064 1.656-3.384 4.08-3.48v6.792l-.792-.12c-2.136-.288-3.288-1.248-3.288-3.072zm4.944 11.424v-7.224l.72.096c2.304.312 3.624 1.32 3.624 3.264v.144c0 2.232-1.728 3.624-4.344 3.72z"  /></Svg>;
}

export default DollarUltraLight;