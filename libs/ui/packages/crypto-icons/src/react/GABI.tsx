import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#000";
function GABI({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path  fillRule="evenodd" d="M12 22.56c5.832 0 10.56-4.728 10.56-10.56S17.832 1.44 12 1.44c-3.549 0-6.689 1.75-8.604 4.435h3.908a.845.845 0 010 1.69h-4.89q-.285.614-.49 1.267h11.592a.845.845 0 110 1.69H1.541q-.097.689-.102 1.404h4.124a.845.845 0 010 1.69H1.562q.106.686.297 1.34h11.657a.845.845 0 110 1.69H2.513q.377.765.864 1.454h3.926a.845.845 0 110 1.69H4.869A10.52 10.52 0 0012 22.56m3.835-5.913a.845.845 0 110-1.69.845.845 0 010 1.69m-.845-6.97a.845.845 0 101.69 0 .845.845 0 00-1.69 0M8.645 18.95a.845.845 0 101.69 0 .845.845 0 00-1.69 0M9.49 7.565a.845.845 0 110-1.69.845.845 0 010 1.69m.037 5.205c0 .467.379.845.845.845h9.502a.845.845 0 100-1.69h-9.502a.845.845 0 00-.845.845m-1.565.845a.845.845 0 110-1.69.845.845 0 010 1.69" clipRule="evenodd" /><path stroke="#000" strokeWidth={0.48} d="M23.76 12c0 6.495-5.265 11.76-11.76 11.76S.24 18.495.24 12 5.505.24 12 .24 23.76 5.505 23.76 12z" /></Svg>;
}
GABI.DefaultColor = DefaultColor;
export default GABI;