import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function RefreshThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M3.12 11.856v.24h.48v-.24C3.6 7.248 7.32 3.6 11.976 3.6c3.216 0 6.072 1.92 7.536 4.704h-5.256v.48H20.4V2.64h-.48v5.4c-1.536-2.904-4.536-4.92-7.944-4.92-4.92 0-8.856 3.864-8.856 8.736zm.48 9.504h.48v-5.4c1.536 2.904 4.536 4.92 7.944 4.92 4.92 0 8.856-3.864 8.856-8.736v-.24h-.48v.24c0 4.608-3.72 8.256-8.376 8.256-3.216 0-6.072-1.92-7.536-4.704h5.256v-.48H3.6v6.144z"  /></Svg>;
}

export default RefreshThin;