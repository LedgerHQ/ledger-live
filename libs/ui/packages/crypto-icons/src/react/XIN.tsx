import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#1eb5fa";
function XIN({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M19.836 5.501L17.113 6.71a.5.5 0 00-.262.442v9.735a.5.5 0 00.27.443l2.722 1.177a.254.254 0 00.375-.225V5.726a.262.262 0 00-.382-.225M6.796 6.694l-2.64-1.2a.254.254 0 00-.374.225v12.555a.256.256 0 00.39.217l2.655-1.402a.5.5 0 00.24-.428V7.136a.53.53 0 00-.27-.442m8.28 3.322L12.235 8.39a.5.5 0 00-.502 0L8.837 10a.51.51 0 00-.255.443v3.3c0 .182.097.35.255.442l2.895 1.665a.5.5 0 00.502 0l2.843-1.65a.51.51 0 00.255-.442v-3.3a.5.5 0 00-.255-.443" /></Svg>;
}
XIN.DefaultColor = DefaultColor;
export default XIN;