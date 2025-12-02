import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#008200";
function XP({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  d="M11.093 17.25H9.744l-.812-3.187 1.984-1.037.646 1.845.48-2.434 2.637-1.377-.146.731 1.523.015q.881-.015 1.367-.595.486-.582.462-1.562a2 2 0 00-.027-.251l2.048-1.07q.424.781.325 1.84-.165 1.545-1.334 2.47-1.17.927-2.98.927l-1.73-.007-.732 3.692zm.315-8.242h1.313l-2.023 2.868-4.995 2.611 1.851-2.617-1.779-5.12h2.61l.922 3.592.79-1.335h1.312-1.312l1.408-2.257h1.661l3.845.008q1.31.035 2.15.695l-2.1 1.098a1 1 0 00-.157-.02l-1.72-.015-.225 1.133-2.638 1.378.399-2.02zM4.34 16.464l3.995-2.089-1.761 2.875H3.75l.575-.814z" /></Svg>;
}
XP.DefaultColor = DefaultColor;
export default XP;