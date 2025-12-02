import * as React from "react";
import  { Path } from "react-native-svg";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#fec907";
function DEW({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path  d="M7.996 17.112a.83.83 0 01.84.819.83.83 0 01-.84.819h-1.09a.92.92 0 01-.64-.259.87.87 0 01-.266-.625V6.112c0-.229.093-.448.259-.61a.9.9 0 01.624-.252h1.168a.83.83 0 01.84.819.8.8 0 01-.246.579.85.85 0 01-.594.24h-.258v10.224zm9.127-8.589Q18 10.028 18 11.891t-.887 3.37c-.59 1.004-1.246 1.773-2.324 2.47-.99.64-2.023 1.018-3.305 1.018h-.425a.83.83 0 01-.84-.819.83.83 0 01.84-.818h.517c.908 0 1.567-.376 2.307-.802s1.214-1.125 1.643-1.878q.645-1.129.645-2.521 0-1.412-.654-2.541a4.8 4.8 0 00-1.782-1.78q-1.13-.648-2.51-.649h-.223a.83.83 0 01-.84-.818c0-.218.089-.426.246-.579a.85.85 0 01.594-.24h.261q1.904 0 3.443.856a6.3 6.3 0 012.417 2.363" /></Svg>;
}
DEW.DefaultColor = DefaultColor;
export default DEW;