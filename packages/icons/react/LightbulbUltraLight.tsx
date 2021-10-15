import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LightbulbUltraLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M9.192 18v3.48h5.616V18c0-1.224.36-1.872 1.536-3.192l.576-.672c1.272-1.488 1.968-3 1.968-4.8 0-4.056-3.24-6.816-6.888-6.816-3.648 0-6.888 2.76-6.888 6.816 0 1.8.696 3.312 1.968 4.8l.576.672c1.176 1.32 1.536 1.968 1.536 3.192zm-3.24-8.664c0-3.6 2.832-6 6.048-6s6.048 2.4 6.048 6c0 1.584-.6 2.928-1.752 4.248l-.6.672c-1.2 1.392-1.704 2.256-1.728 3.84h-1.56v-5.592h-.816v5.592h-1.56c-.024-1.584-.528-2.448-1.728-3.84l-.6-.672c-1.152-1.32-1.752-2.664-1.752-4.248zm4.08 11.328v-1.8h3.936v1.8h-3.936z"  /></Svg>;
}

export default LightbulbUltraLight;