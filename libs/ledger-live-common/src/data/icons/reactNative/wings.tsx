
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function wings({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M14.178 11.4318L11.8942 13.2048L10.959 9.96101L5.54095 8.50977L12.6517 8.87502L14.178 11.4318Z" fill={color} fillOpacity={0.2} /><Path d="M6.20251 17.6224L18.4395 8.12512L19.5 10.4846L18.1088 10.0999L18.06 12.5479L6.20251 17.6224Z" fill={color} fillOpacity={0.5} /><Path d="M17.097 12.9626L13.5367 6.84181L4.5 6.37756L11.3872 8.22331L13.2547 14.5908L17.097 12.9626Z" fill={color} /></Svg>;
}
export default wings;